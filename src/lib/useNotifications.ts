import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuthStore } from './store';
import { useToastStore } from './useToast';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from './api';
import type { Notification } from '../types';

export function useNotifications() {
  const { profile, setUnreadNotifications, incrementUnread } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications(profile.id),
        fetchUnreadCount(profile.id),
      ]);
      setNotifications(notifs as Notification[]);
      setUnreadNotifications(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      useToastStore.getState().addToast('error', 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
          incrementUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const markRead = useCallback(
    async (id: string) => {
      try {
        await markNotificationRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadNotifications(
          Math.max(0, useAuthStore.getState().unreadNotifications - 1)
        );
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    if (!profile?.id) return;
    try {
      await markAllNotificationsRead(profile.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifications(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  }, [profile?.id]);

  return { notifications, isLoading, markRead, markAllRead, refetch: load };
}
