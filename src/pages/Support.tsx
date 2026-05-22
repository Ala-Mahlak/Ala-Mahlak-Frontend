import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Send, Ticket, MessageCircle, Search, Clock } from 'lucide-react';
import { type TicketStatus, type TicketPriority } from '../data/mockData';
import { appQueryKeys, useSupportData } from '../hooks/useAppData';

type Tab = 'chat' | 'tickets';

const ticketStatusConfig: Record<TicketStatus, { label: string; class: string }> = {
  open: { label: 'Open', class: 'bg-blue-100 text-blue-700' },
  'in-progress': { label: 'In Progress', class: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', class: 'bg-emerald-100 text-emerald-700' },
};

const ticketPriorityConfig: Record<TicketPriority, { label: string; class: string; dot: string }> = {
  high: { label: 'High', class: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
  medium: { label: 'Medium', class: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
  low: { label: 'Low', class: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

export default function Support() {
  const [tab, setTab] = useState<Tab>('chat');
  const queryClient = useQueryClient();
  const { data } = useSupportData();
  const conversations = data?.conversations ?? [];
  const tickets = data?.tickets ?? [];
  const [activeConv, setActiveConv] = useState(conversations[0]?.id ?? '1');
  const [message, setMessage] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'all' | TicketStatus>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConv = conversations.find(c => c.id === activeConv);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv, conversations]);

  useEffect(() => {
    if (!currentConv && conversations[0]) {
      setActiveConv(conversations[0].id);
    }
  }, [conversations, currentConv]);

  const handleSend = () => {
    if (!message.trim() || !currentConv) return;

    queryClient.setQueryData(appQueryKeys.support, (previous: { conversations: typeof conversations; tickets: typeof tickets } | undefined) => {
      if (!previous) return previous;

      return {
        ...previous,
        conversations: previous.conversations.map(conversation =>
          conversation.id === activeConv
            ? {
                ...conversation,
                messages: [...conversation.messages, { from: 'company', text: message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
                preview: message,
                time: 'Just now',
              }
            : conversation
        ),
      };
    });
    setMessage('');
  };

  const filteredTickets = ticketFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === ticketFilter);

  return (
    <div className="flex gap-5 h-[calc(100vh-160px)]">
      {/* Left sidebar */}
      <div className="w-52 flex-shrink-0 space-y-2">
        <button
          onClick={() => setTab('chat')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            tab === 'chat' ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageCircle size={15} />
            Live Chat
          </div>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'chat' ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
            3
          </span>
        </button>
        <button
          onClick={() => setTab('tickets')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            tab === 'tickets' ? 'bg-blue-500 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Ticket size={15} />
            Tickets
          </div>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === 'tickets' ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
            {tickets.filter(t => t.status !== 'resolved').length}
          </span>
        </button>

        {/* Quick stats */}
        <div className="bg-white rounded-xl border border-slate-100 p-3 mt-4">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Today's Stats</div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Open Chats</span>
              <span className="font-bold text-slate-700">3</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Resolved</span>
              <span className="font-bold text-emerald-600">8</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Avg Response</span>
              <span className="font-bold text-slate-700">4 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' ? (
          /* Chat interface */
          <div className="flex h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Conversation list */}
            <div className="w-72 border-r border-slate-100 flex flex-col">
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                      activeConv === conv.id ? 'bg-blue-50/70 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: conv.driverColor }}
                      >
                        {conv.driverInitials}
                      </div>
                      {conv.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white pulse-dot" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-slate-800 truncate">{conv.driverName}</span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{conv.time}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{conv.preview}</div>
                    </div>
                    {conv.unread > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat window */}
            {currentConv && (
              <div className="flex-1 flex flex-col">
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: currentConv.driverColor }}
                    >
                      {currentConv.driverInitials}
                    </div>
                    {currentConv.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{currentConv.driverName}</div>
                    <div className={`text-xs ${currentConv.online ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {currentConv.online ? '● Online' : '○ Offline'}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-4">
                  {currentConv.messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col max-w-[72%] ${msg.from === 'company' ? 'ml-auto items-end' : 'items-start'}`}
                    >
                      <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                        msg.from === 'company' ? 'chat-bubble-company' : 'chat-bubble-driver text-slate-700'
                      }`}>
                        {msg.text}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-5 py-4 border-t border-slate-100">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <button
                      onClick={handleSend}
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center text-white transition-colors shadow-sm shadow-blue-500/25"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
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
                  {(['all', 'open', 'in-progress', 'resolved'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setTicketFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        ticketFilter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-50">
              {filteredTickets.map(ticket => {
                const sc = ticketStatusConfig[ticket.status];
                const pc = ticketPriorityConfig[ticket.priority];
                return (
                  <div key={ticket.id} className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-500">{ticket.id}</span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${pc.class}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                          {pc.label}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.class}`}>
                        {sc.label}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-800 text-sm mb-2">{ticket.title}</div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ background: ticket.driverColor }}
                        >
                          {ticket.driverInitials}
                        </div>
                        <span className="text-xs text-slate-500">{ticket.driverName}</span>
                        <span className="text-slate-300">·</span>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={11} />
                          {ticket.date}
                        </div>
                      </div>
                      <button className="text-xs text-blue-500 hover:text-blue-600 font-semibold">
                        View →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
