import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../lib/store';
import { useToast } from '../../lib/useToast';
import { usePresence } from '../../lib/usePresence';
import { fetchConversations } from '../../lib/api';
import ConversationList from '../../components/messages/ConversationList';
import ChatPanel from '../../components/messages/ChatPanel';

export default function MessagesPage() {
  const { profile } = useAuthStore();
  const toast = useToast();
  const { isOnline } = usePresence(profile?.id);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [showChat, setShowChat] = useState(false); // mobile toggle

  useEffect(() => {
    async function load() {
      if (!profile?.id || !profile.role) return;
      setIsLoading(true);
      try {
        const convs = await fetchConversations(profile.id, profile.role);
        setConversations(convs);
        // Auto-select first conversation on desktop
        if (convs.length > 0 && !activeConv) {
          setActiveConv(convs[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
        toast.error('Failed to load conversations.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [profile?.id, profile?.role]);

  function handleSelect(conv: any) {
    setActiveConv(conv);
    setShowChat(true); // show chat on mobile
  }

  const channelId = useMemo(() => {
    if (!activeConv) return undefined;
    return activeConv.type === 'dm'
      ? activeConv.connectionId
      : activeConv.groupId;
  }, [activeConv]);

  return (
    <div className="animate-fade-in -m-6">
      {/* Full-height messaging layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Conversation sidebar */}
        <div
          className={`w-full lg:w-80 border-r border-slate-100 bg-white flex-shrink-0 overflow-y-auto ${
            showChat ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="p-4 border-b border-slate-100">
            <h1 className="font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-brand-blue-500" />
              Messages
            </h1>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeConv?.id || null}
              onSelect={handleSelect}
              isOnline={isOnline}
            />
          )}
        </div>

        {/* Chat panel */}
        <div
          className={`flex-1 flex flex-col ${
            !showChat ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeConv && channelId ? (
            <ChatPanel
              type={activeConv.type}
              channelId={channelId}
              userId={profile!.id}
              partnerName={activeConv.name}
              partnerAvatar={activeConv.partnerAvatar}
              onBack={() => setShowChat(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium text-sm">Select a conversation</p>
              <p className="text-xs mt-1">
                Choose a chat from the sidebar to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
