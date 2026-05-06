-- =============================================================
-- ROW LEVEL SECURITY POLICIES
-- Run this AFTER 001_create_tables.sql
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- PROFILES
-- ================================================================
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================================
-- MENTOR PROFILES
-- ================================================================
CREATE POLICY "Anyone can view mentor profiles" ON public.mentor_profiles
  FOR SELECT USING (true);

CREATE POLICY "Mentors can insert own profile" ON public.mentor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentors can update own profile" ON public.mentor_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- MENTEE PROFILES
-- ================================================================
CREATE POLICY "Anyone can view mentee profiles" ON public.mentee_profiles
  FOR SELECT USING (true);

CREATE POLICY "Mentees can insert own profile" ON public.mentee_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentees can update own profile" ON public.mentee_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- CONNECTIONS
-- ================================================================
CREATE POLICY "Participants can view their connections" ON public.connections
  FOR SELECT USING (
    auth.uid() = mentor_id OR auth.uid() = mentee_id
  );

CREATE POLICY "Mentees can send connection requests" ON public.connections
  FOR INSERT WITH CHECK (
    auth.uid() = mentee_id
    AND status = 'pending'
  );

CREATE POLICY "Mentors can update connection status" ON public.connections
  FOR UPDATE USING (auth.uid() = mentor_id)
  WITH CHECK (auth.uid() = mentor_id);

-- ================================================================
-- GROUPS
-- ================================================================
CREATE POLICY "Group members can view groups" ON public.groups
  FOR SELECT USING (
    auth.uid() = mentor_id
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update own groups" ON public.groups
  FOR UPDATE USING (auth.uid() = mentor_id);

-- ================================================================
-- GROUP MEMBERS
-- ================================================================
CREATE POLICY "Members can view group membership" ON public.group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND (groups.mentor_id = auth.uid() OR group_members.user_id = auth.uid())
    )
  );

CREATE POLICY "Mentors can manage group members" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.mentor_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can remove group members" ON public.group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.mentor_id = auth.uid()
    )
  );

-- ================================================================
-- MESSAGES
-- ================================================================
-- DMs: only if connection is active
CREATE POLICY "DM participants can view messages" ON public.messages
  FOR SELECT USING (
    (type = 'dm' AND EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.id = messages.connection_id
      AND connections.status = 'active'
      AND (connections.mentor_id = auth.uid() OR connections.mentee_id = auth.uid())
    ))
    OR
    (type = 'group' AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = messages.group_id
      AND group_members.user_id = auth.uid()
    ))
    OR
    (type = 'group' AND EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = messages.group_id
      AND groups.mentor_id = auth.uid()
    ))
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND (
      (type = 'dm' AND EXISTS (
        SELECT 1 FROM public.connections
        WHERE connections.id = messages.connection_id
        AND connections.status = 'active'
        AND (connections.mentor_id = auth.uid() OR connections.mentee_id = auth.uid())
      ))
      OR
      (type = 'group' AND (
        EXISTS (
          SELECT 1 FROM public.group_members
          WHERE group_members.group_id = messages.group_id
          AND group_members.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.groups
          WHERE groups.id = messages.group_id
          AND groups.mentor_id = auth.uid()
        )
      ))
    )
  );

-- ================================================================
-- CURRICULA
-- ================================================================
CREATE POLICY "Connection participants can view curricula" ON public.curricula
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.id = curricula.connection_id
      AND (connections.mentor_id = auth.uid() OR connections.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Connection participants can manage curricula" ON public.curricula
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.id = curricula.connection_id
      AND connections.status = 'active'
      AND (connections.mentor_id = auth.uid() OR connections.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Connection participants can update curricula" ON public.curricula
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.id = curricula.connection_id
      AND connections.status = 'active'
      AND (connections.mentor_id = auth.uid() OR connections.mentee_id = auth.uid())
    )
  );

-- ================================================================
-- EVENTS
-- ================================================================
CREATE POLICY "Connected users can view events" ON public.events
  FOR SELECT USING (
    auth.uid() = mentor_id
    OR (invite_type = 'group' AND EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.mentor_id = events.mentor_id
      AND connections.mentee_id = auth.uid()
      AND connections.status = 'active'
    ))
    OR (invite_type = 'private' AND invitee_id = auth.uid())
  );

CREATE POLICY "Mentors can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can update events" ON public.events
  FOR UPDATE USING (auth.uid() = mentor_id);

-- ================================================================
-- RATINGS
-- ================================================================
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Participants can create ratings" ON public.ratings
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.connections
      WHERE connections.id = ratings.connection_id
      AND (connections.mentor_id = auth.uid() OR connections.mentee_id = auth.uid())
      AND connections.status IN ('active', 'ended')
    )
  );
