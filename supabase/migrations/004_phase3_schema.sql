-- =============================================================
-- PHASE 3 SCHEMA ADDITIONS
-- Run this AFTER 003_triggers.sql
-- =============================================================

-- ---- 1. NOTIFICATIONS TABLE ----
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'connection_request', 'connection_accepted', 'connection_rejected',
    'new_message', 'event_created', 'event_reminder', 'review_received'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- ---- 2. EVENT RSVPS TABLE ----
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON public.event_rsvps(event_id);

-- ---- 3. PROFILE ADDITIONS ----
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{
  "in_app_connections": true,
  "in_app_messages": true,
  "in_app_events": true,
  "in_app_reviews": true,
  "email_connections": true,
  "email_messages": false,
  "email_events": true,
  "email_reviews": true
}';

-- ================================================================
-- RLS POLICIES
-- ================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Notifications: users can only see their own
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System inserts notifications (via triggers / SECURITY DEFINER)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Event RSVPs
CREATE POLICY "Event participants can view RSVPs" ON public.event_rsvps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_rsvps.event_id
      AND (
        events.mentor_id = auth.uid()
        OR (events.invite_type = 'group' AND EXISTS (
          SELECT 1 FROM public.connections
          WHERE connections.mentor_id = events.mentor_id
          AND connections.mentee_id = auth.uid()
          AND connections.status = 'active'
        ))
        OR (events.invite_type = 'private' AND events.invitee_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can manage own RSVPs" ON public.event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVPs" ON public.event_rsvps
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs" ON public.event_rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- ENABLE REALTIME ON NOTIFICATIONS
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ================================================================
-- NOTIFICATION TRIGGERS
-- ================================================================

-- Auto-notify mentor when a connection request is received
CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS TRIGGER AS $$
DECLARE
  mentee_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT full_name INTO mentee_name FROM public.profiles WHERE id = NEW.mentee_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.mentor_id,
      'connection_request',
      'New Mentorship Request',
      COALESCE(mentee_name, 'Someone') || ' wants to connect with you.',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_connection_request_notify ON public.connections;
CREATE TRIGGER on_connection_request_notify
  AFTER INSERT ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.notify_connection_request();

-- Auto-notify mentee when connection is accepted/rejected
CREATE OR REPLACE FUNCTION public.notify_connection_response()
RETURNS TRIGGER AS $$
DECLARE
  mentor_name TEXT;
  notif_type TEXT;
  notif_title TEXT;
  notif_body TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('active', 'rejected') THEN
    SELECT full_name INTO mentor_name FROM public.profiles WHERE id = NEW.mentor_id;
    IF NEW.status = 'active' THEN
      notif_type := 'connection_accepted';
      notif_title := 'Request Accepted!';
      notif_body := COALESCE(mentor_name, 'A mentor') || ' accepted your mentorship request.';
    ELSE
      notif_type := 'connection_rejected';
      notif_title := 'Request Declined';
      notif_body := COALESCE(mentor_name, 'A mentor') || ' declined your request.';
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.mentee_id, notif_type, notif_title, notif_body, '/dashboard');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_connection_response_notify ON public.connections;
CREATE TRIGGER on_connection_response_notify
  AFTER UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.notify_connection_response();

-- Auto-notify on review received
CREATE OR REPLACE FUNCTION public.notify_review_received()
RETURNS TRIGGER AS $$
DECLARE
  reviewer_name TEXT;
BEGIN
  SELECT full_name INTO reviewer_name FROM public.profiles WHERE id = NEW.reviewer_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.reviewee_id,
    'review_received',
    'New Review',
    COALESCE(reviewer_name, 'Someone') || ' left you a ' || NEW.score || '-star review.',
    '/ratings'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_received_notify ON public.ratings;
CREATE TRIGGER on_review_received_notify
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.notify_review_received();

-- Auto-notify on event creation
CREATE OR REPLACE FUNCTION public.notify_event_created()
RETURNS TRIGGER AS $$
DECLARE
  mentor_name TEXT;
  mentee_record RECORD;
BEGIN
  SELECT full_name INTO mentor_name FROM public.profiles WHERE id = NEW.mentor_id;

  IF NEW.invite_type = 'private' AND NEW.invitee_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.invitee_id,
      'event_created',
      'New Session Scheduled',
      COALESCE(mentor_name, 'Your mentor') || ' scheduled: ' || NEW.title,
      '/events'
    );
  ELSIF NEW.invite_type = 'group' THEN
    FOR mentee_record IN
      SELECT mentee_id FROM public.connections
      WHERE mentor_id = NEW.mentor_id AND status = 'active'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        mentee_record.mentee_id,
        'event_created',
        'New Group Session',
        COALESCE(mentor_name, 'Your mentor') || ' scheduled: ' || NEW.title,
        '/events'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_created_notify ON public.events;
CREATE TRIGGER on_event_created_notify
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_created();
