-- =============================================================
-- FIX REALTIME MESSAGING
-- Run this in Supabase SQL Editor
-- Ensures Realtime delivers full row payloads for messages,
-- connections, and notifications.
-- =============================================================

-- ================================================================
-- 1. REPLICA IDENTITY FULL
-- Required for Supabase Realtime postgres_changes to deliver
-- the full row (not just the PK) in INSERT/UPDATE/DELETE events.
-- ================================================================
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.connections REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ================================================================
-- 2. ENSURE TABLES ARE IN REALTIME PUBLICATION
-- These are idempotent — safe to re-run even if already added.
-- If already present, the DO block silently skips.
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'connections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ================================================================
-- 3. VERIFY SETUP (run SELECT to confirm)
-- After running, execute this to confirm:
--
--   SELECT tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime';
--
-- You should see: messages, connections, notifications, events
-- ================================================================
