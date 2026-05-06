import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';
import { fetchMessages, sendMessage as sendMessageApi } from './api';
import { useToastStore } from './useToast';

interface UseChatOptions {
  type: 'dm' | 'group';
  channelId: string | undefined;
  userId: string | undefined;
}

export function useChat({ type, channelId, userId }: UseChatOptions) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!channelId) return;
    setIsLoading(true);
    try {
      const data = await fetchMessages(type, channelId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
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
    const channel = supabase
      .channel(`chat-${type}-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `${column}=eq.${channelId}`,
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, channelId]);

  // Send message
  const sendMsg = useCallback(
    async (content: string) => {
      if (!userId || !channelId || !content.trim()) return;
      setIsSending(true);
      try {
        await sendMessageApi(userId, type, channelId, content.trim());
      } catch (err) {
        console.error('Failed to send message:', err);
        useToastStore.getState().addToast('error', 'Failed to send message.');
      } finally {
        setIsSending(false);
      }
    },
    [userId, type, channelId]
  );

  return { messages, isLoading, isSending, sendMessage: sendMsg, refetch: loadMessages };
}
