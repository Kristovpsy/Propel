-- =============================================================
-- PHASE — MATCHING ALGORITHM METRICS
-- Run this AFTER 007_mentee_profile_fields.sql in the Supabase SQL Editor
-- =============================================================

-- ================================================================
-- 1. MENTOR RESPONSE / ACCEPTANCE TRACKING COLUMNS
-- ================================================================

-- Raw counters (used to compute rates)
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS total_requests   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_responded  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_accepted   INTEGER NOT NULL DEFAULT 0;

-- Derived rates (0.0 – 1.0)
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS response_rate    FLOAT NOT NULL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS acceptance_ratio FLOAT NOT NULL DEFAULT 0.0;

-- ================================================================
-- 2. BACK-FILL EXISTING DATA
--    Calculate metrics from existing connections so current mentors
--    already have accurate numbers after migration.
-- ================================================================

-- total_requests = all connection rows where this mentor is the target
UPDATE public.mentor_profiles mp
SET total_requests = sub.cnt
FROM (
  SELECT mentor_id, COUNT(*) AS cnt
  FROM public.connections
  GROUP BY mentor_id
) sub
WHERE mp.user_id = sub.mentor_id;

-- total_responded = connections that moved out of 'pending' (active OR rejected)
UPDATE public.mentor_profiles mp
SET total_responded = sub.cnt
FROM (
  SELECT mentor_id, COUNT(*) AS cnt
  FROM public.connections
  WHERE status IN ('active', 'rejected', 'ended')
  GROUP BY mentor_id
) sub
WHERE mp.user_id = sub.mentor_id;

-- total_accepted = connections accepted (active or ended after being active)
UPDATE public.mentor_profiles mp
SET total_accepted = sub.cnt
FROM (
  SELECT mentor_id, COUNT(*) AS cnt
  FROM public.connections
  WHERE status IN ('active', 'ended')
  GROUP BY mentor_id
) sub
WHERE mp.user_id = sub.mentor_id;

-- Compute derived rates from the back-filled counters
UPDATE public.mentor_profiles
SET
  response_rate    = CASE WHEN total_requests > 0 THEN total_responded::FLOAT / total_requests ELSE 0.0 END,
  acceptance_ratio = CASE WHEN total_responded > 0 THEN total_accepted::FLOAT / total_responded ELSE 0.0 END;

-- ================================================================
-- 3. TRIGGER: AUTO-UPDATE METRICS ON CONNECTION INSERT / UPDATE
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_mentor_metrics()
RETURNS TRIGGER AS $$
DECLARE
  target_mentor_id UUID;
BEGIN
  -- Determine the mentor to update
  target_mentor_id := COALESCE(NEW.mentor_id, OLD.mentor_id);

  -- Recalculate all counters from scratch for accuracy
  UPDATE public.mentor_profiles
  SET
    total_requests   = (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id),
    total_responded  = (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id AND status IN ('active', 'rejected', 'ended')),
    total_accepted   = (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id AND status IN ('active', 'ended')),
    response_rate    = CASE
      WHEN (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id) > 0
      THEN (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id AND status IN ('active', 'rejected', 'ended'))::FLOAT
           / (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id)
      ELSE 0.0 END,
    acceptance_ratio = CASE
      WHEN (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id AND status IN ('active', 'rejected', 'ended')) > 0
      THEN (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id AND status IN ('active', 'ended'))::FLOAT
           / (SELECT COUNT(*) FROM public.connections WHERE mentor_id = target_mentor_id AND status IN ('active', 'rejected', 'ended'))
      ELSE 0.0 END
  WHERE user_id = target_mentor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire on INSERT (new request) and UPDATE (status changed)
DROP TRIGGER IF EXISTS on_connection_update_mentor_metrics ON public.connections;
CREATE TRIGGER on_connection_update_mentor_metrics
  AFTER INSERT OR UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_mentor_metrics();
