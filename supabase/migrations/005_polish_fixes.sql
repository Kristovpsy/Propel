-- =============================================================
-- PHASE 4 — POLISH FIXES
-- Run this AFTER 004_phase3_schema.sql in the Supabase SQL Editor
-- =============================================================

-- ================================================================
-- 1. MISSING RLS POLICIES
-- ================================================================

-- Mentors can delete their own events (required by deleteEvent() in api.ts)
CREATE POLICY "Mentors can delete own events" ON public.events
  FOR DELETE USING (auth.uid() = mentor_id);

-- Users can delete their own profile (required by deleteAccount() in api.ts)
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ================================================================
-- 2. ENABLE REALTIME ON EVENTS
-- Currently only messages, connections, and notifications are
-- in the realtime publication — events is missing
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
