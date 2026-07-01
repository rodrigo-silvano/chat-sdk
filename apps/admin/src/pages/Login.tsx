import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../App.js';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export default function Login() {
  const { login, verify2Fa, error, loading, token, operator, requires2Fa, clearError } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [step]);

  useEffect(() => {
    if (token && operator) {
      if (!operator.totpEnabled) {
        navigate('/setup-2fa', { replace: true });
      } else if (!requires2Fa) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [token, operator, requires2Fa, navigate]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const success = await login(email, password);
    if (!success && requires2Fa) {
      setStep('otp');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    const success = await verify2Fa(otp);
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="login-layout">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-logo">CHAT SDK</div>
          <p className="login-subtitle">
            {step === 'credentials'
              ? 'Painel de Administração do Operador'
              : 'Verificação em Dois Passos (2FA)'}
          </p>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit}>
            <div className="form-group">
              <label className="input-label" htmlFor="email">E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#8b949e" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  placeholder="admin@chatsdk.com"
                  style={{ paddingLeft: '44px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="password">Palavra-passe</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#8b949e" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  style={{ paddingLeft: '44px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="glow-btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="setup-instructions">
              Insira o código de segurança temporário gerado pela sua aplicação de autenticação (Google Authenticator, Authy, etc.).
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="otp">Código de Verificação</label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={18} color="#8b949e" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  id="otp"
                  type="text"
                  className="input-field"
                  placeholder="000000"
                  maxLength={6}
                  style={{ paddingLeft: '44px', letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="outline-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setStep('credentials')}
                disabled={loading}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="glow-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'A validar...' : 'Verificar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
