import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../App.js';
import { useSocket } from '../hooks/useSocket.js';
import ConversationDetail from './ConversationDetail.js';
import { MessageSquare, Search, ShieldAlert, Sparkles, User, AlertCircle, Bot, CheckCircle } from 'lucide-react';

interface ConversationItem {
  id: string;
  agentId: string;
  sessionId: string;
  status: string;
  assignedOperatorId: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export default function Conversations() {
  const { token, operator } = useAuthContext();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTyping, setActiveTyping] = useState<Record<string, { name: string; isTyping: boolean }>>({});

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Erro ao obter conversas');
      }
      const data = await response.json();
      setConversations(data);
    } catch (err: any) {
      setError(err.message || 'Erro de rede');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  const { sendTyping } = useSocket({
    token,
    activeConversationId: selectedId,
    onStatusChanged: (data) => {
      fetchConversations();
      if (selectedId === data.conversationId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === data.conversationId
              ? { ...c, status: data.status, assignedOperatorId: data.assignedOperatorId || c.assignedOperatorId }
              : c
          )
        );
      }
    },
    onNewMessage: (msg) => {
      fetchConversations();
    },
    onTypingIndicator: (data) => {
      setActiveTyping((prev) => ({
        ...prev,
        [data.conversationId]: { name: data.name, isTyping: data.isTyping },
      }));
    },
  });

  const selectedConv = conversations.find((c) => c.id === selectedId) || null;

  const filtered = conversations.filter((c) =>
    c.sessionId.toLowerCase().includes(search.toLowerCase())
  );

  const queueList = filtered.filter(
    (c) => c.status === 'handover_requested' || c.status === 'waiting_for_agent'
  );
  const humanList = filtered.filter((c) => c.status === 'active_human');
  const botList = filtered.filter((c) => c.status === 'active_bot');
  const resolvedList = filtered.filter((c) => c.status === 'resolved');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active_bot':
        return <span className="badge badge-active">Bot</span>;
      case 'handover_requested':
      case 'waiting_for_agent':
        return <span className="badge badge-waiting">Fila</span>;
      case 'active_human':
        return <span className="badge badge-handover">Operador</span>;
      case 'resolved':
        return <span className="badge badge-resolved">Resolvida</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {error && (
        <div className="alert-box alert-error">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="conversations-container">
        <aside className="conversations-sidebar">
          <div className="conv-sidebar-header">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Conversas</h2>
            <div className="conv-search">
              <Search size={16} color="#8b949e" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="Procurar sessão..."
                className="input-field"
                style={{ paddingLeft: '36px', paddingRight: '12px', height: '38px', fontSize: '0.9rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="conv-list">
            {loading ? (
              <div style={{ padding: '20px', color: '#8b949e', textAlign: 'center', fontSize: '0.9rem' }}>
                A carregar...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '20px', color: '#8b949e', textAlign: 'center', fontSize: '0.9rem' }}>
                Nenhuma conversa encontrada
              </div>
            ) : (
              <>
                {queueList.length > 0 && (
                  <div>
                    <div className="conv-group-title">Fila de Espera ({queueList.length})</div>
                    {queueList.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`conv-item ${selectedId === c.id ? 'active' : ''}`}
                      >
                        <div className="conv-item-header">
                          <span className="conv-item-name">Sessão: {c.sessionId}</span>
                          <span className="conv-item-time">
                            {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span className="conv-item-preview">Aguardando operador humano</span>
                          {getStatusBadge(c.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {humanList.length > 0 && (
                  <div>
                    <div className="conv-group-title">Com Operador ({humanList.length})</div>
                    {humanList.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`conv-item ${selectedId === c.id ? 'active' : ''}`}
                      >
                        <div className="conv-item-header">
                          <span className="conv-item-name">Sessão: {c.sessionId}</span>
                          <span className="conv-item-time">
                            {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span className="conv-item-preview">
                            {c.assignedOperatorId === operator?.id ? 'Atendida por mim' : 'Outro operador'}
                          </span>
                          {getStatusBadge(c.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {botList.length > 0 && (
                  <div>
                    <div className="conv-group-title">Com Bot ({botList.length})</div>
                    {botList.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`conv-item ${selectedId === c.id ? 'active' : ''}`}
                      >
                        <div className="conv-item-header">
                          <span className="conv-item-name">Sessão: {c.sessionId}</span>
                          <span className="conv-item-time">
                            {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span className="conv-item-preview">Conversação ativa com IA</span>
                          {getStatusBadge(c.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {resolvedList.length > 0 && (
                  <div>
                    <div className="conv-group-title">Resolvidas ({resolvedList.length})</div>
                    {resolvedList.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`conv-item ${selectedId === c.id ? 'active' : ''}`}
                      >
                        <div className="conv-item-header">
                          <span className="conv-item-name">Sessão: {c.sessionId}</span>
                          <span className="conv-item-time">
                            {new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span className="conv-item-preview">Resolvida / Arquivada</span>
                          {getStatusBadge(c.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        <section className="conv-detail-container">
          {selectedConv ? (
            <ConversationDetail
              conversation={selectedConv}
              token={token}
              operator={operator}
              onRefresh={fetchConversations}
              typingIndicator={activeTyping[selectedConv.id]}
              sendTyping={sendTyping}
            />
          ) : (
            <div className="no-conversation-selected">
              <div style={{ background: 'rgba(69, 243, 255, 0.05)', padding: '24px', borderRadius: '50%', border: '1px solid rgba(69, 243, 255, 0.1)', display: 'inline-flex' }}>
                <MessageSquare size={48} color="#45f3ff" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Nenhuma conversa selecionada</h3>
              <p style={{ fontSize: '0.9rem', color: '#8b949e', maxWidth: '300px', textAlign: 'center' }}>
                Escolha uma conversa na lista lateral para visualizar o histórico e iniciar o atendimento.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
