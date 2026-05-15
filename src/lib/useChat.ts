import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { fetchMessages, sendMessage as sendMessageApi } from './api';
import { useToastStore } from './useToast';

interface UseChatOptions {
  type: 'dm' | 'group';
  channelId: string | undefined;
  userId: string | undefined;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  connection_id: string | null;
  group_id: string | null;
  content: string;
  type: 'dm' | 'group';
  created_at: string;
  sender?: { id: string; full_name: string; avatar_url: string | null };
  _optimistic?: boolean; // local-only flag for optimistic messages
}

// Simple in-memory cache for sender profiles (avoids re-fetching)
const senderCache = new Map<string, { id: string; full_name: string; avatar_url: string | null }>();

export function useChat({ type, channelId, userId }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!channelId) return;
    setIsLoading(true);
    try {
      const data = await fetchMessages(type, channelId);
      setMessages(data as ChatMessage[]);

      // Cache sender profiles from loaded messages
      data.forEach((msg: any) => {
        if (msg.sender?.id) {
          senderCache.set(msg.sender.id, msg.sender);
        }
      });
    } catch (err: any) {
      console.error('[useChat] Failed to load messages:', {
        error: err,
        code: err?.code,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        type,
        channelId,
      });
      useToastStore.getState().addToast('error', 'Failed to load messages.');
    } finally {
      setIsLoading(false);
    }
  }, [type, channelId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!channelId) return;

    const column = type === 'dm' ? 'connection_id' : 'group_id';
    const channelName = `chat-${type}-${channelId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `${column}=eq.${channelId}`,
        },
        async (payload) => {
          const newRow = payload.new as any;

          if (!newRow?.id) return;

          // Build the message object from the Realtime payload
          let senderInfo = senderCache.get(newRow.sender_id);

          // If sender not in cache, fetch their profile
          if (!senderInfo) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', newRow.sender_id)
                .single();

              if (profile) {
                senderInfo = profile;
                senderCache.set(profile.id, profile);
              }
            } catch (err) {
              console.warn('[useChat] Could not fetch sender profile:', err);
            }
          }

          const enrichedMessage: ChatMessage = {
            id: newRow.id,
            sender_id: newRow.sender_id,
            connection_id: newRow.connection_id,
            group_id: newRow.group_id,
            content: newRow.content,
            type: newRow.type,
            created_at: newRow.created_at,
            sender: senderInfo || { id: newRow.sender_id, full_name: 'User', avatar_url: null },
          };

          setMessages((prev) => {
            // Remove any optimistic message with matching content from this sender
            // and avoid duplicates by ID
            const withoutOptimistic = prev.filter(
              (m) =>
                !(m._optimistic && m.sender_id === newRow.sender_id && m.content === newRow.content)
            );

            // Check for ID duplicates
            if (withoutOptimistic.some((m) => m.id === newRow.id)) {
              return withoutOptimistic;
            }

            return [...withoutOptimistic, enrichedMessage];
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[useChat] Realtime subscribed: ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[useChat] Realtime channel error:`, err);
        } else if (status === 'TIMED_OUT') {
          console.warn(`[useChat] Realtime subscription timed out: ${channelName}`);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, channelId]);

  // Send message with optimistic update
  const sendMsg = useCallback(
    async (content: string) => {
      if (!userId || !channelId || !content.trim()) return;

      const trimmed = content.trim();
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Cache the current user's profile info for optimistic rendering
      const currentUserSender = senderCache.get(userId) || {
        id: userId,
        full_name: 'You',
        avatar_url: null,
      };

      // Optimistic: immediately add message to local state
      const optimisticMsg: ChatMessage = {
        id: tempId,
        sender_id: userId,
        connection_id: type === 'dm' ? channelId : null,
        group_id: type === 'group' ? channelId : null,
        content: trimmed,
        type,
        created_at: new Date().toISOString(),
        sender: currentUserSender,
        _optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setIsSending(true);

      try {
        const sentMsg = await sendMessageApi(userId, type, channelId, trimmed);

        // Cache sender info from the response
        if (sentMsg?.sender?.id) {
          senderCache.set(sentMsg.sender.id, sentMsg.sender);
        }

        // The Realtime subscription will handle replacing the optimistic message
        // with the real one. But if Realtime is slow/broken, we replace it here
        // as a fallback after a short delay.
        setTimeout(() => {
          setMessages((prev) => {
            const hasReal = prev.some((m) => m.id === sentMsg.id);
            if (hasReal) {
              // Realtime already delivered it — just remove the optimistic one
              return prev.filter((m) => m.id !== tempId);
            }
            // Realtime hasn't delivered it yet — swap optimistic for real
            return prev.map((m) =>
              m.id === tempId ? { ...sentMsg, _optimistic: undefined } : m
            );
          });
        }, 2000);
      } catch (err: any) {
        console.error('[useChat] Failed to send message:', {
          error: err,
          code: err?.code,
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
        });

        // Remove the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        useToastStore.getState().addToast('error', 'Failed to send message.');
      } finally {
        setIsSending(false);
      }
    },
    [userId, type, channelId]
  );

  return { messages, isLoading, isSending, sendMessage: sendMsg, refetch: loadMessages };
}
