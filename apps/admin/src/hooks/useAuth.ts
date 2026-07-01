import { useState, useEffect } from 'react';
import type { Operator } from '@chat-sdk/shared';

export interface AuthContextType {
  token: string | null;
  operator: Operator | null;
  requires2Fa: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  verify2Fa: (code: string) => Promise<boolean>;
  setup2Fa: () => Promise<{ secret: string; qrCode: string }>;
  logout: () => void;
  clearError: () => void;
}

export function useAuth(): AuthContextType {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('chat_sdk_token'));
  const [operator, setOperator] = useState<Operator | null>(() => {
    const saved = localStorage.getItem('chat_sdk_operator');
    return saved ? JSON.parse(saved) : null;
  });
  const [requires2Fa, setRequires2Fa] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('chat_sdk_token', token);
    } else {
      localStorage.removeItem('chat_sdk_token');
    }
  }, [token]);

  useEffect(() => {
    if (operator) {
      localStorage.setItem('chat_sdk_operator', JSON.stringify(operator));
    } else {
      localStorage.removeItem('chat_sdk_operator');
    }
  }, [operator]);

  const clearError = () => setError(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha na autenticação');
      }

      const data = await response.json();
      if (data.requires2Fa) {
        setToken(data.token);
        setOperator(data.operator);
        setRequires2Fa(true);
        setLoading(false);
        return false;
      } else {
        setToken(data.token);
        setOperator(data.operator);
        setRequires2Fa(false);
        setLoading(false);
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erro de rede');
      setLoading(false);
      return false;
    }
  };

  const verify2Fa = async (code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ token: code }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Código 2FA inválido');
      }

      const data = await response.json();
      setToken(data.token);
      
      if (operator) {
        const updated = { ...operator, totpEnabled: true };
        setOperator(updated);
      }
      
      setRequires2Fa(false);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro de verificação');
      setLoading(false);
      return false;
    }
  };

  const setup2Fa = async (): Promise<{ secret: string; qrCode: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao configurar 2FA');
      }

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro de rede');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setOperator(null);
    setRequires2Fa(false);
    setError(null);
    localStorage.removeItem('chat_sdk_token');
    localStorage.removeItem('chat_sdk_operator');
  };

  return {
    token,
    operator,
    requires2Fa,
    loading,
    error,
    login,
    verify2Fa,
    setup2Fa,
    logout,
    clearError,
  };
}
