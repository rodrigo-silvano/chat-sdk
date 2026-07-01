import React, { createContext, useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth, AuthContextType } from './hooks/useAuth.js';
import Login from './pages/Login.js';
import Setup2FA from './pages/Setup2FA.js';
import Dashboard from './pages/Dashboard.js';
import Conversations from './pages/Conversations.js';
import Settings from './pages/Settings.js';
import AgentSettings from './pages/AgentSettings.js';
import { LayoutDashboard, MessageSquare, Bot, Settings as SettingsIcon, LogOut, Radio } from 'lucide-react';

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

function PrivateLayout({ children }: { children: React.ReactNode }) {
  const { token, operator, logout } = useAuthContext();
  const location = useLocation();

  if (!token || !operator) {
    return <Navigate to="/login" replace />;
  }

  if (operator && !operator.totpEnabled) {
    return <Navigate to="/setup-2fa" replace />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Radio size={24} color="#45f3ff" />
          <span className="logo-text">CHAT SDK</span>
        </div>
        <nav className="sidebar-menu">
          <Link
            to="/dashboard"
            className={`menu-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/conversations"
            className={`menu-item ${location.pathname.startsWith('/conversations') ? 'active' : ''}`}
          >
            <MessageSquare size={20} />
            <span>Conversas</span>
          </Link>
          <Link
            to="/agent-settings"
            className={`menu-item ${location.pathname === '/agent-settings' ? 'active' : ''}`}
          >
            <Bot size={20} />
            <span>Agente</span>
          </Link>
          <Link
            to="/settings"
            className={`menu-item ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <SettingsIcon size={20} />
            <span>Definições</span>
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div style={{ padding: '0 16px', fontSize: '0.85rem', color: '#8b949e' }}>
            <div style={{ fontWeight: 600, color: '#f5f6f9', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {operator.name}
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{operator.role}</div>
          </div>
          <button onClick={logout} className="menu-item" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none' }}>
            <LogOut size={20} color="#e74c3c" />
            <span style={{ color: '#e74c3c' }}>Sair</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const auth = useAuth();

  if (auth.loading && !auth.token) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0c10', color: '#45f3ff', fontWeight: 600 }}>
        A carregar...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/setup-2fa" element={
          auth.token && auth.operator ? <Setup2FA /> : <Navigate to="/login" replace />
        } />
        <Route path="/dashboard" element={
          <PrivateLayout>
            <Dashboard />
          </PrivateLayout>
        } />
        <Route path="/conversations" element={
          <PrivateLayout>
            <Conversations />
          </PrivateLayout>
        } />
        <Route path="/agent-settings" element={
          <PrivateLayout>
            <AgentSettings />
          </PrivateLayout>
        } />
        <Route path="/settings" element={
          <PrivateLayout>
            <Settings />
          </PrivateLayout>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
