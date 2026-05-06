-- =============================================================
-- TRIGGERS AND FUNCTIONS
-- Run this AFTER 002_rls_policies.sql
-- =============================================================

-- ================================================================
-- 1. AUTO-CREATE PROFILE ON USER SIGN-UP
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mentee'),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 2. AUTO-CREATE GROUP FOR MENTORS
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_mentor()
RETURNS TRIGGER AS $$
DECLARE
  mentor_name TEXT;
BEGIN
  SELECT full_name INTO mentor_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.groups (mentor_id, name)
  VALUES (NEW.user_id, COALESCE(mentor_name, 'Mentor') || '''s Group');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_mentor_profile_created ON public.mentor_profiles;
CREATE TRIGGER on_mentor_profile_created
  AFTER INSERT ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_mentor();

-- ================================================================
-- 3. CONNECTION ACCEPTANCE — UPDATE CAPACITY & ADD TO GROUP
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
RETURNS TRIGGER AS $$
DECLARE
  mentor_group_id UUID;
BEGIN
  -- Only trigger when status changes to 'active'
  IF OLD.status != 'active' AND NEW.status = 'active' THEN
    -- Increment mentor's current_count
    UPDATE public.mentor_profiles
    SET 
      current_count = current_count + 1,
      is_at_capacity = (current_count + 1 >= max_capacity)
    WHERE user_id = NEW.mentor_id;

    -- Add mentee to mentor's group
    SELECT id INTO mentor_group_id FROM public.groups WHERE mentor_id = NEW.mentor_id;
    IF mentor_group_id IS NOT NULL THEN
      INSERT INTO public.group_members (group_id, user_id)
      VALUES (mentor_group_id, NEW.mentee_id)
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END IF;
  END IF;

  -- Handle connection ending — decrement count
  IF OLD.status = 'active' AND NEW.status = 'ended' THEN
    UPDATE public.mentor_profiles
    SET 
      current_count = GREATEST(current_count - 1, 0),
      is_at_capacity = (GREATEST(current_count - 1, 0) >= max_capacity)
    WHERE user_id = NEW.mentor_id;

    -- Remove mentee from group
    SELECT id INTO mentor_group_id FROM public.groups WHERE mentor_id = NEW.mentor_id;
    IF mentor_group_id IS NOT NULL THEN
      DELETE FROM public.group_members
      WHERE group_id = mentor_group_id AND user_id = NEW.mentee_id;
    END IF;
  END IF;

  -- Set updated_at timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_connection_status_changed ON public.connections;
CREATE TRIGGER on_connection_status_changed
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.handle_connection_accepted();

-- ================================================================
-- 4. PREVENT CONNECTIONS WHEN MENTOR IS AT CAPACITY
-- ================================================================
CREATE OR REPLACE FUNCTION public.check_mentor_capacity()
RETURNS TRIGGER AS $$
DECLARE
  at_cap BOOLEAN;
BEGIN
  SELECT is_at_capacity INTO at_cap
  FROM public.mentor_profiles
  WHERE user_id = NEW.mentor_id;

  IF at_cap = TRUE AND NEW.status = 'pending' THEN
    RAISE EXCEPTION 'Mentor is at capacity and cannot accept new requests';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_capacity_before_connection ON public.connections;
CREATE TRIGGER check_capacity_before_connection
  BEFORE INSERT ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.check_mentor_capacity();

-- ================================================================
-- 5. ENABLE REALTIME ON KEY TABLES
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
