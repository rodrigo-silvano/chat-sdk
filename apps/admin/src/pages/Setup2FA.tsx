import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../App.js';
import { KeyRound, ShieldAlert } from 'lucide-react';

export default function Setup2FA() {
  const { setup2Fa, verify2Fa, error, loading, operator, logout } = useAuthContext();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (operator?.totpEnabled) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let active = true;
    const fetchQR = async () => {
      try {
        const data = await setup2Fa();
        if (active) {
          setQrCode(data.qrCode);
          setSecret(data.secret);
        }
      } catch (err: any) {
        if (active) {
          setLocalError(err.message || 'Falha ao obter QR code de 2FA');
        }
      }
    };

    fetchQR();
    return () => {
      active = false;
    };
  }, [operator, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setLocalError(null);

    const success = await verify2Fa(code);
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  const displayError = error || localError;

  return (
    <div className="login-layout">
      <div className="login-card glass-panel" style={{ maxWidth: '500px' }}>
        <div className="login-header">
          <div className="login-logo">Configurar 2FA</div>
          <p className="login-subtitle">Aumente a segurança da sua conta</p>
        </div>

        {displayError && (
          <div className="alert-box alert-error">
            <ShieldAlert size={18} />
            <span>{displayError}</span>
          </div>
        )}

        {loading && !qrCode ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#45f3ff' }}>
            A gerar chaves de segurança...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="setup-instructions">
              1. Digitalize o código QR abaixo com a sua aplicação de autenticação (ex: Google Authenticator, Microsoft Authenticator, Authy).
            </p>

            {qrCode && (
              <div className="qr-container">
                <div className="qr-image">
                  <img src={qrCode} alt="Código QR do 2FA" style={{ width: '180px', height: '180px', display: 'block' }} />
                </div>
                {secret && (
                  <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center' }}>
                    Chave manual: <code style={{ color: '#45f3ff', background: '#12161f', padding: '4px 8px', borderRadius: '4px' }}>{secret}</code>
                  </div>
                )}
              </div>
            )}

            <p className="setup-instructions">
              2. Introduza o código de 6 dígitos gerado pela sua aplicação para confirmar a ativação.
            </p>

            <div className="form-group">
              <label className="input-label" htmlFor="verify-code">Código de Confirmação</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} color="#8b949e" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  id="verify-code"
                  type="text"
                  className="input-field"
                  placeholder="000000"
                  maxLength={6}
                  style={{ paddingLeft: '44px', letterSpacing: '4px', textAlign: 'center', fontSize: '1.25rem' }}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="outline-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={logout}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="glow-btn"
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'A ativar...' : 'Confirmar e Ativar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
