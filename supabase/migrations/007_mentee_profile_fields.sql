-- =============================================================
-- ADD bio AND area_of_interest TO mentee_profiles
-- =============================================================

ALTER TABLE public.mentee_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS area_of_interest TEXT NOT NULL DEFAULT '';
