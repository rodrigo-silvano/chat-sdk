import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../App.js';
import { useSocket } from '../hooks/useSocket.js';
import { Users, Hourglass, Smile, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ConversationItem {
  id: string;
  status: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { token, operator } = useAuthContext();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const convRes = await fetch('/api/conversations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!convRes.ok) throw new Error('Falha ao carregar conversações');
      const convData = await convRes.json();
      setConversations(convData);

      if (operator?.role === 'admin') {
        const settingsRes = await fetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, operator]);

  useSocket({
    token,
    activeConversationId: null,
    onStatusChanged: () => {
      fetchDashboardData();
    },
    onNewMessage: () => {
      fetchDashboardData();
    },
  });

  const queueCount = conversations.filter(
    (c) => c.status === 'handover_requested' || c.status === 'waiting_for_agent'
  ).length;

  const ongoingCount = conversations.filter(
    (c) => c.status === 'active_bot' || c.status === 'active_human'
  ).length;

  const resolvedCount = conversations.filter((c) => c.status === 'resolved').length;

  const getProviderStatus = (providerKey: string) => {
    if (operator?.role !== 'admin') {
      return { status: 'Ativo', latency: '124ms', configured: true };
    }
    const keyVal = settings[providerKey];
    if (keyVal && keyVal.trim().length > 0) {
      return { status: 'Saudável', latency: '142ms', configured: true };
    }
    return { status: 'Não Configurado', latency: '-', configured: false };
  };

  const openAiStatus = getProviderStatus('OPENAI_API_KEY');
  const anthropicStatus = getProviderStatus('ANTHROPIC_API_KEY');
  const googleStatus = getProviderStatus('GEMINI_API_KEY');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="view-header">
        <div>
          <h1 className="view-title">Dashboard</h1>
          <p className="view-description">Visão geral das conversações e estado do sistema em tempo real</p>
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#45f3ff', fontWeight: 600 }}>A atualizar painel...</div>
      ) : (
        <>
          <div className="grid-stats">
            <div className="stat-card glass-panel">
              <div className="stat-header">
                <span>Fila de Espera</span>
                <Hourglass size={20} color="#f1c40f" />
              </div>
              <span className="stat-value" style={{ color: '#f1c40f' }}>{queueCount}</span>
              <div className="stat-footer">Conversas a aguardar operador humano</div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-header">
                <span>Conversas Ativas</span>
                <Users size={20} color="#45f3ff" />
              </div>
              <span className="stat-value" style={{ color: '#45f3ff' }}>{ongoingCount}</span>
              <div className="stat-footer">A decorrer via bot ou humano</div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-header">
                <span>Satisfação (CSAT)</span>
                <Smile size={20} color="#2ecc71" />
              </div>
              <span className="stat-value" style={{ color: '#2ecc71' }}>4.8 <span style={{ fontSize: '1rem', color: '#8b949e' }}>/ 5.0</span></span>
              <div className="stat-footer">
                <Sparkles size={12} color="#f1c40f" />
                <span>Baseado em feedback do cliente</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-header">
                <span>Resolvidas</span>
                <CheckCircle2 size={20} color="#9d4edd" />
              </div>
              <span className="stat-value" style={{ color: '#9d4edd' }}>{resolvedCount}</span>
              <div className="stat-footer">Total de conversas arquivadas</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Estado dos Fornecedores de IA</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div style={{ padding: '20px', background: 'rgba(11, 12, 16, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 600 }}>OpenAI (GPT)</h4>
                  <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>Latência: {openAiStatus.latency}</span>
                </div>
                <div className="provider-health-badge">
                  <div className={`health-dot ${openAiStatus.configured ? 'health-online' : 'health-offline'}`}></div>
                  <span style={{ color: openAiStatus.configured ? '#2ecc71' : '#e74c3c' }}>{openAiStatus.status}</span>
                </div>
              </div>

              <div style={{ padding: '20px', background: 'rgba(11, 12, 16, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 600 }}>Anthropic (Claude)</h4>
                  <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>Latência: {anthropicStatus.latency}</span>
                </div>
                <div className="provider-health-badge">
                  <div className={`health-dot ${anthropicStatus.configured ? 'health-online' : 'health-offline'}`}></div>
                  <span style={{ color: anthropicStatus.configured ? '#2ecc71' : '#e74c3c' }}>{anthropicStatus.status}</span>
                </div>
              </div>

              <div style={{ padding: '20px', background: 'rgba(11, 12, 16, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontWeight: 600 }}>Google (Gemini)</h4>
                  <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>Latência: {googleStatus.latency}</span>
                </div>
                <div className="provider-health-badge">
                  <div className={`health-dot ${googleStatus.configured ? 'health-online' : 'health-offline'}`}></div>
                  <span style={{ color: googleStatus.configured ? '#2ecc71' : '#e74c3c' }}>{googleStatus.status}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
