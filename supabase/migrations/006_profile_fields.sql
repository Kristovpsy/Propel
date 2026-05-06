-- =============================================================
-- PHASE 5 — PROFILE PAGE FIELDS
-- Run this AFTER 005_polish_fixes.sql in the Supabase SQL Editor
-- =============================================================

-- ================================================================
-- 1. NEW PROFILE COLUMNS
-- ================================================================

-- Split full_name into first/last for granular profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '';

-- Username (unique, user-chosen handle)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Gender selection
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT
  CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say'));

-- Per-field visibility settings (JSONB map: field_name -> "public" | "only_me")
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS field_visibility JSONB NOT NULL DEFAULT '{
  "first_name": "public",
  "last_name": "public",
  "username": "public",
  "gender": "public",
  "role": "public"
}';

-- ================================================================
-- 2. MENTOR PROFILE ADDITIONS
-- ================================================================

ALTER TABLE public.mentor_profiles ADD COLUMN IF NOT EXISTS area_of_mentorship TEXT NOT NULL DEFAULT '';
ALTER TABLE public.mentor_profiles ADD COLUMN IF NOT EXISTS years_of_experience INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.mentor_profiles ADD COLUMN IF NOT EXISTS portfolio TEXT;

-- ================================================================
-- 3. UPDATE TRIGGER TO HANDLE FIRST/LAST NAME
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name, role, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mentee'),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
