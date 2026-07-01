import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../App.js';
import { ShieldCheck, Mail, Server, Key, Save, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { token, operator } = useAuthContext();
  const [formData, setFormData] = useState({
    openai_api_key: '',
    anthropic_api_key: '',
    google_api_key: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: 'noreply@chatsdk.com',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (operator?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setFormData((prev) => ({
            ...prev,
            openai_api_key: data.openai_api_key || '',
            anthropic_api_key: data.anthropic_api_key || '',
            google_api_key: data.google_api_key || '',
            smtp_host: data.smtp_host || '',
            smtp_port: data.smtp_port || '587',
            smtp_user: data.smtp_user || '',
            smtp_pass: data.smtp_pass || '',
            smtp_from: data.smtp_from || 'noreply@chatsdk.com',
          }));
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Falha ao carregar configurações.' });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token, operator]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: formData }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gravar configurações');
      }

      setMessage({ type: 'success', text: 'Configurações gravadas com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao gravar.' });
    } finally {
      setSaving(false);
    }
  };

  if (operator?.role !== 'admin') {
    return (
      <div className="glass-panel alert-box alert-error" style={{ margin: '40px auto', maxWidth: '600px' }}>
        <AlertTriangle size={24} />
        <div>
          <h4 style={{ fontWeight: 600 }}>Acesso Negado</h4>
          <p style={{ fontSize: '0.85rem' }}>Apenas administradores podem aceder e alterar as configurações do sistema.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ color: '#45f3ff', fontWeight: 600 }}>A carregar definições do sistema...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="view-header">
        <div>
          <h1 className="view-title">Definições do Sistema</h1>
          <p className="view-description">Configuração de provedores de IA e serviços SMTP</p>
        </div>
      </div>

      {message && (
        <div className={`alert-box ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <ShieldCheck size={18} />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-grid">
        <div className="settings-section glass-panel">
          <h3 className="settings-section-title">
            <Key size={18} color="#45f3ff" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Chaves de API dos Fornecedores
          </h3>

          <div className="form-group">
            <label className="input-label" htmlFor="openai_api_key">OpenAI API Key</label>
            <input
              id="openai_api_key"
              name="openai_api_key"
              type="password"
              className="input-field"
              placeholder="sk-..."
              value={formData.openai_api_key}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="anthropic_api_key">Anthropic API Key</label>
            <input
              id="anthropic_api_key"
              name="anthropic_api_key"
              type="password"
              className="input-field"
              placeholder="sk-ant-..."
              value={formData.anthropic_api_key}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="google_api_key">Gemini (Google) API Key</label>
            <input
              id="google_api_key"
              name="google_api_key"
              type="password"
              className="input-field"
              placeholder="AIzaSy..."
              value={formData.google_api_key}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
        </div>

        <div className="settings-section glass-panel">
          <h3 className="settings-section-title">
            <Server size={18} color="#9d4edd" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Configuração SMTP (E-mail)
          </h3>

          <div className="form-group">
            <label className="input-label" htmlFor="smtp_host">Servidor SMTP</label>
            <input
              id="smtp_host"
              name="smtp_host"
              type="text"
              className="input-field"
              placeholder="smtp.mailtrap.io"
              value={formData.smtp_host}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="smtp_port">Porta SMTP</label>
            <input
              id="smtp_port"
              name="smtp_port"
              type="text"
              className="input-field"
              placeholder="587"
              value={formData.smtp_port}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="smtp_user">Utilizador SMTP</label>
            <input
              id="smtp_user"
              name="smtp_user"
              type="text"
              className="input-field"
              placeholder="smtp-username"
              value={formData.smtp_user}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="smtp_pass">Palavra-passe SMTP</label>
            <input
              id="smtp_pass"
              name="smtp_pass"
              type="password"
              className="input-field"
              placeholder="••••••••••••"
              value={formData.smtp_pass}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="input-label" htmlFor="smtp_from">Endereço do Remetente</label>
            <input
              id="smtp_from"
              name="smtp_from"
              type="email"
              className="input-field"
              placeholder="suporte@chatsdk.com"
              value={formData.smtp_from}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="submit" className="glow-btn" disabled={saving}>
            <Save size={18} />
            <span>{saving ? 'A guardar...' : 'Guardar Alterações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
