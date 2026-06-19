import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Ticket, MessageCircle, Search, Loader2, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import {
  getChatConversations,
  getChatMessages,
  sendChatMessage,
  startChatHub,
  stopChatHub,
  joinConversation,
  leaveConversation,
  type ChatMessageResponse,
} from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Tab = 'chat' | 'tickets';

const CONVERSATION_COLORS = ['#4F7DF3', '#7c5df9', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

function getColor(seed: number) {
  return CONVERSATION_COLORS[seed % CONVERSATION_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

interface ConversationUI {
  conversationId: number;
  partnerId: number;
  partnerName: string;
  partnerPhoto: string | null;
  initials: string;
  color: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

export default function Support() {
  const { userType } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('chat');
  const [conversations, setConversations] = useState<ConversationUI[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationUI | null>(null);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hubConnected, setHubConnected] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeConvRef = useRef(activeConv);
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (userType && userType !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [userType, navigate]);

  const loadConversations = useCallback(async () => {
    if (userType !== 'admin') return;
    try {
      const apiConvs = await getChatConversations();

      const uiList: ConversationUI[] = apiConvs.map((conv, idx) => {
        const partnerName = conv.userName;
        const partnerPhoto = conv.userProfilePhoto;
        const partnerId = conv.userId;

        return {
          conversationId: conv.id,
          partnerId,
          partnerName,
          partnerPhoto,
          initials: getInitials(partnerName),
          color: getColor(idx),
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
        };
      });

      setConversations(uiList);
      setActiveConv((prev) => {
        if (prev && uiList.find((c) => c.conversationId === prev.conversationId)) return prev;
        return uiList[0] ?? null;
      });
      setError(null);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [userType]);

  useEffect(() => {
    if (userType !== 'admin') return;
    setLoading(true);
    loadConversations().finally(() => setLoading(false));
  }, [userType, loadConversations]);

  const loadMessages = useCallback(async () => {
    const current = activeConvRef.current;
    if (!current || userType !== 'admin') return;
    try {
      const msgs = await getChatMessages(current.partnerId);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [userType]);

  useEffect(() => {
    loadMessages();
  }, [activeConv?.conversationId, loadMessages]);

  // ─── SignalR ─────────────────────────────────────────────────
  useEffect(() => {
    if (userType !== 'admin') return;

    let cancelled = false;

    const initHub = async () => {
      try {
        await startChatHub((msg: ChatMessageResponse) => {
          if (cancelled) return;
          const active = activeConvRef.current;

          // Append message to current conversation
          if (active && msg.conversationId === active.conversationId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }

          // Update conversation preview
          setConversations((prev) =>
            prev.map((c) =>
              c.conversationId === msg.conversationId
                ? { ...c, lastMessage: msg.message, lastMessageAt: msg.sentAt }
                : c,
            ),
          );
        });
        if (!cancelled) setHubConnected(true);
      } catch (err) {
        console.error('[ChatHub] Failed to start:', err);
      }
    };

    initHub();

    return () => {
      cancelled = true;
      stopChatHub().catch(() => {});
    };
  }, [userType]);

  // Join conversation group when active changes
  const activeConvId = activeConv?.conversationId ?? null;

  useEffect(() => {
    if (!hubConnected || activeConvId === null) return;
    joinConversation(activeConvId);
    return () => {
      leaveConversation(activeConvId).catch(() => {});
    };
  }, [activeConvId, hubConnected]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !activeConv) return;
    try {
      setSending(true);
      setError(null);
      const sent = await sendChatMessage({ partnerId: activeConv.partnerId, message: text });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === sent.conversationId
            ? { ...c, lastMessage: sent.message, lastMessageAt: sent.sentAt }
            : c,
        ),
      );
      setMessageText('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(search.toLowerCase()),
  );

  if (userType && userType !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <div className="text-center text-slate-500">
          <AlertTriangle size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">Access Restricted</h2>
          <p>Support chat is only available for administrators.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <div className="text-slate-500 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-160px)]">
      {/* Left sidebar */}
      <div className="w-52 flex-shrink-0 space-y-2">
        <button
          onClick={() => setTab('chat')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            tab === 'chat'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageCircle size={15} />
            Live Chat
          </div>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'chat' ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
            {conversations.length}
          </span>
        </button>
        <button
          onClick={() => setTab('tickets')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            tab === 'tickets'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Ticket size={15} />
            Tickets
          </div>
        </button>

        {/* Quick stats */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 mt-4">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Chat Stats</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Conversations</span>
              <span className="font-bold text-slate-700">{conversations.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Connection</span>
              <span className={`font-bold flex items-center gap-1 ${hubConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                {hubConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                {hubConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' ? (
          <div className="flex h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Conversation list */}
            <div className="w-72 border-r border-slate-100 flex flex-col">
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {filteredConvs.length === 0 && (
                  <div className="text-center py-6 text-sm text-slate-400">No conversations found</div>
                )}
                {filteredConvs.map((conv) => (
                  <button
                    key={conv.conversationId}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                      activeConv?.conversationId === conv.conversationId
                        ? 'bg-blue-50/70 border-l-2 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {conv.partnerPhoto ? (
                        <img
                          src={conv.partnerPhoto}
                          alt={conv.partnerName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: conv.color }}
                        >
                          {conv.initials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-800 truncate">{conv.partnerName}</span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{formatDate(conv.lastMessageAt)}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate text-left">
                        {conv.lastMessage ?? 'No messages yet'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat window */}
            {activeConv ? (
              <div className="flex-1 flex flex-col">
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  {activeConv.partnerPhoto ? (
                    <img
                      src={activeConv.partnerPhoto}
                      alt={activeConv.partnerName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: activeConv.color }}
                    >
                      {activeConv.initials}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{activeConv.partnerName}</div>
                    <div className="text-xs text-slate-400">Chat Support</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-4">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.senderRole === 'Admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[72%] ${isMine ? 'ml-auto items-end' : 'items-start'}`}
                      >
                        {!isMine && (
                          <div className="text-[10px] text-slate-400 mb-0.5 px-1">{msg.senderName}</div>
                        )}
                        <div
                          className={`px-4 py-2.5 text-sm leading-relaxed rounded-xl ${
                            isMine
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-slate-100 text-slate-700 rounded-bl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(msg.sentAt)}</div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-5 py-4 border-t border-slate-100">
                  {error && (
                    <div className="mb-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
                  )}
                  <div className="flex gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      disabled={sending}
                      maxLength={2000}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !messageText.trim()}
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-xl flex items-center justify-center text-white transition-colors shadow-sm shadow-blue-500/25"
                    >
                      {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                  <div className="mt-1 text-right">
                    <span className="text-[10px] text-slate-400">{messageText.length}/2000</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-slate-400 text-sm">Select a conversation to start chatting</div>
              </div>
            )}
          </div>
        ) : (
          /* Tickets tab */
          <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">Support Tickets</h3>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
                  {(['all', 'open', 'in-progress', 'resolved'] as const).map((f) => (
                    <button
                      key={f}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-slate-500 hover:text-slate-700"
                    >
                      {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-50">
              <div className="text-center py-8 text-sm text-slate-400">Tickets coming soon</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}