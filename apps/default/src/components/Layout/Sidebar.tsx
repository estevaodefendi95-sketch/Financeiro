import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, DollarSign, ShoppingCart, Package,
  BarChart3, Settings, ChevronDown, ChevronRight, LogOut,
  Boxes, X, Calendar, Receipt, ArrowUpRight, ArrowDownRight,
  GitMerge, CreditCard, Target, Bell, Users, TrendingUp
} from 'lucide-react';
import { useAuthStore, useAppStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils';
import { computeStatus } from '../../types';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to?: string;
  children?: { label: string; to: string; icon?: React.ElementType }[];
  badge?: string;
}

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { transactions, bankAccounts, notifications } = useAppStore();
  const [openGroups, setOpenGroups] = useState<string[]>(['Financeiro']);

  const overdue = transactions.filter(t => computeStatus(t) === 'atrasado').length;
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const totalSaldo = bankAccounts.reduce((s, b) => s + b.balance, 0);

  const navItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    {
      label: 'Financeiro', icon: DollarSign,
      children: [
        { label: 'Calendário', to: '/financeiro/calendario', icon: Calendar },
        { label: 'Transações', to: '/financeiro/transacoes', icon: Receipt },
        { label: 'A Receber', to: '/financeiro/receber', icon: ArrowUpRight },
        { label: 'A Pagar', to: '/financeiro/pagar', icon: ArrowDownRight },
        { label: 'Fluxo de Caixa', to: '/financeiro/fluxo', icon: TrendingUp },
        { label: 'Conciliação', to: '/financeiro/conciliacao', icon: GitMerge },
        { label: 'Cartões de Crédito', to: '/financeiro/cartoes', icon: CreditCard },
      ],
    },
    {
      label: 'Vendas', icon: ShoppingCart,
      children: [
        { label: 'Clientes', to: '/vendas/clientes', icon: Users },
        { label: 'Pedidos de Venda', to: '/vendas/pedidos' },
        { label: 'Produtos e Serviços', to: '/vendas/produtos' },
      ],
    },
    { label: 'Estoque', icon: Boxes, to: '/estoque' },
    {
      label: 'Relatórios', icon: BarChart3,
      children: [
        { label: 'DRE', to: '/relatorios/dre' },
        { label: 'Fluxo de Caixa', to: '/relatorios/fluxo' },
        { label: 'Inadimplência', to: '/relatorios/inadimplencia' },
        { label: 'Por Categoria', to: '/relatorios/categorias' },
        { label: 'Orçamento', to: '/relatorios/orcamento' },
      ],
    },
    { label: 'Configurações', icon: Settings, to: '/configuracoes' },
  ];

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const handleLogout = () => { logout(); toast.info('Sessão encerrada'); navigate('/login'); };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1a2e4a] dark:bg-[#0d1b2e] text-white">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">SuaEmpresa</p>
            <p className="text-blue-300 text-xs">Gestão Financeira</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
      </div>

      {/* Saldo Card */}
      <div className="mx-3 mt-3 p-3 bg-white/8 rounded-xl border border-white/10">
        <p className="text-blue-300 text-xs mb-1">Saldo Total</p>
        <p className={cn('text-lg font-bold', totalSaldo >= 0 ? 'text-green-400' : 'text-red-400')}>{formatCurrency(totalSaldo)}</p>
        {overdue > 0 && <p className="text-xs text-red-400 mt-1">⚠ {overdue} em atraso</p>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(item => {
          if (!item.children) {
            return (
              <NavLink key={item.to} to={item.to!} onClick={onClose} className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all', isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-100 hover:bg-white/8 hover:text-white')}>
                <item.icon className="w-4 h-4 flex-shrink-0" /> {item.label}
              </NavLink>
            );
          }
          const isOpen = openGroups.includes(item.label);
          return (
            <div key={item.label}>
              <button onClick={() => toggleGroup(item.label)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/8 hover:text-white transition-all">
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {isOpen && (
                <div className="ml-3 mt-0.5 pl-4 border-l border-white/10 space-y-0.5">
                  {item.children!.map(child => (
                    <NavLink key={child.to} to={child.to} onClick={onClose} className={({ isActive }) => cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all', isActive ? 'bg-white/15 text-white font-medium' : 'text-blue-200 hover:bg-white/8 hover:text-white')}>
                      {child.icon && <child.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/8 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-blue-300 capitalize truncate">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-blue-300 hover:text-white flex-shrink-0" title="Sair">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0">{sidebarContent}</aside>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
