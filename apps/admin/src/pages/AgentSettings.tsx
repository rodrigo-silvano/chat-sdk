import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../App.js';
import { Bot, Save, AlertTriangle, Plus, Trash2, ShieldCheck } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  greetingMessage: string;
  systemPrompt: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  temperature: number;
  maxTokens: number;
  config: Record<string, unknown>;
}

export default function AgentSettings() {
  const { token, operator } = useAuthContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);

  const fetchAgents = async (selectId?: string) => {
    try {
      const response = await fetch('/api/agents', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
        if (data.length > 0) {
          const toSelect = selectId ? data.find((a: Agent) => a.id === selectId) : data[0];
          selectAgent(toSelect || data[0]);
        } else {
          setSelectedAgent(null);
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao obter lista de agentes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [token]);

  const selectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setName(agent.name);
    setGreetingMessage(agent.greetingMessage);
    systemPrompt !== agent.systemPrompt && setSystemPrompt(agent.systemPrompt);
    setProvider(agent.provider);
    setModel(agent.model);
    setTemperature(agent.temperature);
    setMaxTokens(agent.maxTokens);
  };

  useEffect(() => {
    if (provider === 'openai') {
      setModel('gpt-4o-mini');
    } else if (provider === 'anthropic') {
      setModel('claude-3-5-sonnet-latest');
    } else if (provider === 'google') {
      setModel('gemini-1.5-flash');
    }
  }, [provider]);

  const handleCreateNew = () => {
    setSelectedAgent(null);
    setName('Novo Agente');
    setGreetingMessage('Olá! Como posso ajudar hoje?');
    setSystemPrompt('Tu és um assistente útil e profissional.');
    setProvider('openai');
    setModel('gpt-4o-mini');
    setTemperature(0.7);
    setMaxTokens(2048);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (operator?.role !== 'admin') {
      setMessage({ type: 'error', text: 'Permissão negada. Apenas administradores podem gerir agentes.' });
      return;
    }
    setSaving(true);
    setMessage(null);

    const payload = {
      name,
      greetingMessage,
      systemPrompt,
      provider,
      model,
      temperature,
      maxTokens,
      config: {},
    };

    try {
      let url = '/api/agents';
      let method = 'POST';

      if (selectedAgent) {
        url = `/api/agents/${selectedAgent.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao guardar configurações do agente.');
      }

      const savedAgent = await response.json();
      setMessage({ type: 'success', text: 'Configurações do agente guardadas com sucesso!' });
      await fetchAgents(savedAgent.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    if (!confirm(`Tem a certeza que deseja eliminar o agente "${selectedAgent.name}"?`)) return;
    if (operator?.role !== 'admin') {
      setMessage({ type: 'error', text: 'Apenas administradores podem eliminar agentes.' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Falha ao eliminar agente.');
      }

      setMessage({ type: 'success', text: 'Agente eliminado com sucesso!' });
      await fetchAgents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao eliminar.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#45f3ff', fontWeight: 600 }}>A carregar configurações dos agentes...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="view-header">
        <div>
          <h1 className="view-title">Configurações de Agentes</h1>
          <p className="view-description">Gira as configurações dos assistentes de inteligência artificial</p>
        </div>
        {operator?.role === 'admin' && (
          <button onClick={handleCreateNew} className="glow-btn">
            <Plus size={18} />
            <span>Criar Agente</span>
          </button>
        )}
      </div>

      {message && (
        <div className={`alert-box ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <ShieldCheck size={18} />
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ width: '280px', padding: '20px', flexShrink: 0 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#8b949e', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Agentes Disponíveis
          </h3>
          {agents.length === 0 ? (
            <div style={{ color: '#8b949e', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
              Nenhum agente configurado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => selectAgent(agent)}
                  className={`menu-item ${selectedAgent?.id === agent.id ? 'active' : ''}`}
                  style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', textAlign: 'left' }}
                >
                  <Bot size={18} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="agent-settings-card glass-panel" style={{ flex: 1, minWidth: '320px' }}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={20} color="#45f3ff" />
                <span>{selectedAgent ? `Editar: ${selectedAgent.name}` : 'Criar Novo Agente'}</span>
              </h3>
              {selectedAgent && operator?.role === 'admin' && (
                <button type="button" onClick={handleDelete} className="danger-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="agent-name">Nome do Agente</label>
              <input
                id="agent-name"
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving || operator?.role !== 'admin'}
              />
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="greeting-msg">Mensagem de Boas-vindas</label>
              <input
                id="greeting-msg"
                type="text"
                className="input-field"
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                required
                disabled={saving || operator?.role !== 'admin'}
              />
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="system-prompt">Prompt do Sistema (Instruções)</label>
              <textarea
                id="system-prompt"
                className="input-field"
                style={{ minHeight: '140px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                required
                disabled={saving || operator?.role !== 'admin'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="input-label" htmlFor="provider-select">Provedor LLM</label>
                <select
                  id="provider-select"
                  className="input-field"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  disabled={saving || operator?.role !== 'admin'}
                  style={{ appearance: 'auto', background: '#0b0c10' }}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google Gemini</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label" htmlFor="model-select">Modelo</label>
                <select
                  id="model-select"
                  className="input-field"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={saving || operator?.role !== 'admin'}
                  style={{ appearance: 'auto', background: '#0b0c10' }}
                >
                  {provider === 'openai' && (
                    <>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4o">gpt-4o</option>
                      <option value="o3-mini">o3-mini</option>
                      <option value="o1">o1</option>
                      <option value="o1-mini">o1-mini</option>
                      <option value="o1-preview">o1-preview</option>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                      <option value="gpt-4">gpt-4</option>
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    </>
                  )}
                  {provider === 'anthropic' && (
                    <>
                      <option value="claude-3-5-sonnet-latest">claude-3-5-sonnet-latest</option>
                      <option value="claude-3-5-haiku-latest">claude-3-5-haiku-latest</option>
                      <option value="claude-3-opus-latest">claude-3-opus-latest</option>
                      <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
                      <option value="claude-3-5-sonnet-20240620">claude-3-5-sonnet-20240620</option>
                      <option value="claude-3-opus-20240229">claude-3-opus-20240229</option>
                      <option value="claude-3-sonnet-20240229">claude-3-sonnet-20240229</option>
                      <option value="claude-3-haiku-20240307">claude-3-haiku-20240307</option>
                    </>
                  )}
                  {provider === 'google' && (
                    <>
                      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                      <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="input-label" htmlFor="temperature-slider">Temperatura ({temperature})</label>
                <input
                  id="temperature-slider"
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  style={{ width: '100%', height: '38px', accentColor: '#45f3ff' }}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  disabled={saving || operator?.role !== 'admin'}
                />
              </div>

              <div className="form-group">
                <label className="input-label" htmlFor="max-tokens">Max Tokens</label>
                <input
                  id="max-tokens"
                  type="number"
                  className="input-field"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  min={1}
                  required
                  disabled={saving || operator?.role !== 'admin'}
                />
              </div>
            </div>

            {operator?.role === 'admin' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="submit" className="glow-btn" disabled={saving}>
                  <Save size={18} />
                  <span>{saving ? 'A guardar...' : 'Guardar Configurações'}</span>
                </button>
              </div>
            ) : (
              <div className="alert-box alert-error" style={{ marginTop: '24px' }}>
                <AlertTriangle size={18} />
                <span>Apenas leitura: não tem permissões para editar este agente.</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
