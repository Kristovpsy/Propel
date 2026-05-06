import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { useChat } from '../../lib/useChat';

interface ChatPanelProps {
  type: 'dm' | 'group';
  channelId: string;
  userId: string;
  partnerName: string;
  partnerAvatar?: string | null;
  onBack?: () => void;
}

export default function ChatPanel({
  type,
  channelId,
  userId,
  partnerName,
  partnerAvatar,
  onBack,
}: ChatPanelProps) {
  const { messages, isLoading, isSending, sendMessage } = useChat({
    type,
    channelId,
    userId,
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [channelId]);

  async function handleSend() {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (isToday) return time;
    if (isYesterday) return `Yesterday ${time}`;
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' +
      time
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-white flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-600 transition-colors lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {partnerAvatar ? (
          <img
            src={partnerAvatar}
            alt={partnerName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
            {partnerName.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-slate-900">{partnerName}</p>
          <p className="text-[11px] text-slate-400">
            {type === 'dm' ? 'Direct message' : 'Group chat'}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs mt-1">
              Say hello to start the conversation! 👋
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isOwn = msg.sender_id === userId;
              const showAvatar =
                i === 0 ||
                messages[i - 1]?.sender_id !== msg.sender_id;
              const showTimestamp =
                i === messages.length - 1 ||
                messages[i + 1]?.sender_id !== msg.sender_id ||
                new Date(messages[i + 1]?.created_at).getTime() -
                  new Date(msg.created_at).getTime() >
                  300000;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    isOwn ? 'flex-row-reverse' : ''
                  } ${showAvatar ? 'mt-3' : 'mt-0.5'}`}
                >
                  {/* Avatar */}
                  <div className="w-7 flex-shrink-0">
                    {!isOwn && showAvatar && (
                      <>
                        {msg.sender?.avatar_url ? (
                          <img
                            src={msg.sender.avatar_url}
                            alt={msg.sender.full_name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-[10px] font-bold">
                            {msg.sender?.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[70%] ${
                      isOwn
                        ? 'bg-brand-blue-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md'
                    } px-3.5 py-2`}
                  >
                    {!isOwn && showAvatar && type === 'group' && (
                      <p className="text-[10px] font-semibold text-brand-blue-500 mb-0.5">
                        {msg.sender?.full_name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                    </p>
                    {showTimestamp && (
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="input-field flex-1 py-2.5 text-sm"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
