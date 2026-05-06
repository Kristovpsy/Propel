import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

const PRESENCE_CHANNEL = 'propel-presence';

export function usePresence(userId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const userIds = new Set<string>();
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => {
            if (p.user_id) userIds.add(p.user_id);
          });
        });
        setOnlineUsers(userIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const isOnline = useCallback(
    (uid: string) => onlineUsers.has(uid),
    [onlineUsers]
  );

  return { onlineUsers, isOnline };
}
