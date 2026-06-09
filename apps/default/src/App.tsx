import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore, useAppStore } from './store/useStore';
import AppLayout from './components/Layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import CalendarioPage from './pages/financeiro/CalendarioPage';
import TransacoesPage from './pages/financeiro/TransacoesPage';
import ContasPagarPage from './pages/financeiro/ContasPagarPage';
import ContasReceberPage from './pages/financeiro/ContasReceberPage';
import FluxoCaixaPage from './pages/financeiro/FluxoCaixaPage';
import ConciliacaoPage from './pages/financeiro/ConciliacaoPage';
import ClientesPage from './pages/vendas/ClientesPage';
import PedidosPage from './pages/vendas/PedidosPage';
import ProdutosPage from './pages/vendas/ProdutosPage';
import EstoquePage from './pages/EstoquePage';
import RelatoriosPage from './pages/RelatoriosPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';

function ProtectedRoutes({ darkMode, toggleDark }: { darkMode: boolean; toggleDark: () => void }) {
  const { isAuthenticated, user, onboardingComplete } = useAuthStore();
  const { loadFromSupabase } = useAppStore();

  useEffect(() => {
    if (isAuthenticated) loadFromSupabase(user?.companyId);
  }, [isAuthenticated, user?.companyId, loadFromSupabase]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <AppLayout darkMode={darkMode} toggleDark={toggleDark} />;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDark = () => setDarkMode(d => !d);

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" expand closeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<ProtectedRoutes darkMode={darkMode} toggleDark={toggleDark} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          {/* Financeiro */}
          <Route path="financeiro/calendario" element={<CalendarioPage />} />
          <Route path="financeiro/transacoes" element={<TransacoesPage />} />
          <Route path="financeiro/pagar" element={<ContasPagarPage />} />
          <Route path="financeiro/receber" element={<ContasReceberPage />} />
          <Route path="financeiro/fluxo" element={<FluxoCaixaPage />} />
          <Route path="financeiro/conciliacao" element={<ConciliacaoPage />} />
          <Route path="financeiro/cartoes" element={<div className="p-8 text-center text-muted-foreground">Cartões de Crédito — Em breve (Phase 3)</div>} />
          {/* Vendas */}
          <Route path="vendas/clientes" element={<ClientesPage />} />
          <Route path="vendas/pedidos" element={<PedidosPage />} />
          <Route path="vendas/produtos" element={<ProdutosPage />} />
          {/* Other */}
          <Route path="estoque" element={<EstoquePage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="relatorios/*" element={<RelatoriosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
