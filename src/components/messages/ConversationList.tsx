import { MessageCircle, Users } from 'lucide-react';

interface ConversationListProps {
  conversations: {
    id: string;
    type: 'dm' | 'group';
    name: string;
    connectionId?: string;
    groupId?: string;
    partnerId?: string;
    partnerAvatar?: string | null;
  }[];
  activeId: string | null;
  onSelect: (conv: ConversationListProps['conversations'][0]) => void;
  isOnline: (userId: string) => boolean;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  isOnline,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 px-4">
        <MessageCircle className="w-10 h-10 mb-3 text-slate-300" />
        <p className="text-sm font-medium">No conversations</p>
        <p className="text-xs text-center mt-1">
          Connect with a mentor or mentee to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const online = conv.partnerId ? isOnline(conv.partnerId) : false;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
              isActive
                ? 'bg-brand-blue-50 border border-brand-blue-200 shadow-sm'
                : 'hover:bg-slate-50 border border-transparent'
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {conv.type === 'dm' ? (
                conv.partnerAvatar ? (
                  <img
                    src={conv.partnerAvatar}
                    alt={conv.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                    {conv.name.charAt(0)}
                  </div>
                )
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              )}

              {/* Online indicator */}
              {conv.type === 'dm' && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    online ? 'bg-emerald-400' : 'bg-slate-300'
                  }`}
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold truncate ${
                  isActive ? 'text-brand-blue-700' : 'text-slate-800'
                }`}
              >
                {conv.name}
              </p>
              <p className="text-[11px] text-slate-400">
                {conv.type === 'dm' ? 'Direct message' : 'Group chat'}
              </p>
            </div>

            {/* Type badge */}
            {conv.type === 'group' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">
                Group
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
