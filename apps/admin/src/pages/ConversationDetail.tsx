import React, { useState, useEffect, useRef } from 'react';
import { Play, Check, Send, User, Bot, UserCheck, CheckCircle2, MessageSquareDashed } from 'lucide-react';
import type { Operator } from '@chat-sdk/shared';

interface Conversation {
  id: string;
  agentId: string;
  sessionId: string;
  status: string;
  assignedOperatorId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'operator';
  content: string;
  senderType: 'user' | 'bot' | 'human';
  createdAt: string;
}

interface ConversationDetailProps {
  conversation: Conversation;
  token: string | null;
  operator: Operator | null;
  onRefresh: () => void;
  typingIndicator?: { name: string; isTyping: boolean };
  sendTyping: (isTyping: boolean, name: string) => void;
}

export default function ConversationDetail({
  conversation,
  token,
  operator,
  onRefresh,
  typingIndicator,
  sendTyping,
}: ConversationDetailProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversation.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingIndicator]);

  const handleClaim = async () => {
    try {
      const response = await fetch(`/api/handover/${conversation.id}/assign`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (_) {}
  };

  const handleResolve = async () => {
    try {
      const response = await fetch(`/api/handover/${conversation.id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (_) {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/handover/${conversation.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyText }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setReplyText('');
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        sendTyping(false, operator?.name || '');
        setIsTypingLocal(false);
      }
    } catch (_) {
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);

    if (operator) {
      if (!isTypingLocal) {
        setIsTypingLocal(true);
        sendTyping(true, operator.name);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false, operator.name);
        setIsTypingLocal(false);
      }, 1500);
    }
  };

  const isAssignedToMe = conversation.assignedOperatorId === operator?.id;
  const isClaimable =
    conversation.status === 'handover_requested' ||
    conversation.status === 'waiting_for_agent' ||
    (conversation.status === 'active_human' && !isAssignedToMe);

  const getSenderName = (msg: Message) => {
    if (msg.senderType === 'user') return 'Cliente';
    if (msg.senderType === 'bot') return 'IA Assistente';
    if (msg.senderType === 'human') return 'Operador';
    return msg.role;
  };

  const getSenderIcon = (msg: Message) => {
    if (msg.senderType === 'user') return <User size={12} style={{ marginRight: '4px' }} />;
    if (msg.senderType === 'bot') return <Bot size={12} style={{ marginRight: '4px' }} />;
    return <UserCheck size={12} style={{ marginRight: '4px' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="conv-detail-header">
        <div className="conv-detail-user">
          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Sessão: {conversation.sessionId}</span>
          <span style={{ fontSize: '0.8rem', color: '#8b949e', marginTop: '2px' }}>
            ID da conversa: {conversation.id}
          </span>
        </div>

        <div className="conv-detail-actions">
          {isClaimable && (
            <button onClick={handleClaim} className="glow-btn" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              <Play size={16} />
              <span>Assumir Atendimento</span>
            </button>
          )}

          {conversation.status === 'active_human' && isAssignedToMe && (
            <button onClick={handleResolve} className="outline-btn" style={{ padding: '8px 16px', fontSize: '0.9rem', borderColor: '#2ecc71', color: '#2ecc71' }}>
              <CheckCircle2 size={16} />
              <span>Resolver e Finalizar</span>
            </button>
          )}
        </div>
      </header>

      <div className="conv-messages" ref={scrollRef}>
        {loading && messages.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}>
            A carregar histórico...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8b949e', gap: '8px' }}>
            <MessageSquareDashed size={32} />
            <span>Nenhuma mensagem nesta conversa.</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`message-bubble-wrapper ${msg.senderType === 'user' ? 'user' : msg.senderType === 'bot' ? 'assistant' : 'operator'}`}>
              <div className="message-sender-name">
                {getSenderIcon(msg)}
                {getSenderName(msg)}
              </div>
              <div className="message-bubble">{msg.content}</div>
              <div className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}

        {typingIndicator && typingIndicator.isTyping && (
          <div className="typing-indicator">
            {typingIndicator.name} está a escrever...
          </div>
        )}
      </div>

      <footer className="conv-input-container">
        {conversation.status === 'active_human' && isAssignedToMe ? (
          <form onSubmit={handleSend} className="conv-input-form">
            <input
              type="text"
              className="input-field conv-input"
              placeholder="Escreva a sua resposta..."
              value={replyText}
              onChange={handleInputChange}
              disabled={submitting}
              autoFocus
            />
            <button type="submit" className="glow-btn" disabled={submitting || !replyText.trim()} style={{ padding: '12px' }}>
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div style={{ padding: '8px', background: 'rgba(11, 12, 16, 0.4)', border: '1px solid var(--glass-border)', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', color: '#8b949e' }}>
            {conversation.status === 'resolved'
              ? 'Esta conversa está resolvida. Não é possível enviar mensagens.'
              : 'Reivindique o atendimento desta conversa para poder responder.'}
          </div>
        )}
      </footer>
    </div>
  );
}
