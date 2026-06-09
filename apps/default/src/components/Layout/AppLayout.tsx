import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuthStore, useAppStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  darkMode: boolean;
  toggleDark: () => void;
}

export default function AppLayout({ darkMode, toggleDark }: AppLayoutProps) {
  const { user } = useAuthStore();
  const { notifications, markAllNotificationsRead } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifs(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={cn('flex h-screen overflow-hidden', darkMode ? 'dark' : '')}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Top Header */}
        <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 flex-shrink-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="hidden md:flex relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input className="w-full pl-9 pr-4 py-1.5 border border-border rounded-xl bg-muted/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all" placeholder="Buscar... (em breve)" />
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* DB Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Supabase
            </div>

            {/* Dark mode */}
            <button onClick={toggleDark} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title={darkMode ? 'Modo claro' : 'Modo escuro'}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5">{unread > 9 ? '9+' : unread}</span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-xl shadow-xl z-50">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground text-sm">Notificações</h3>
                    {unread > 0 && <button onClick={markAllNotificationsRead} className="text-xs text-primary hover:underline">Marcar tudo como lido</button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Sem notificações</div>
                    ) : notifications.slice(0, 8).map(n => (
                      <div key={n.id} className={cn('p-4 hover:bg-muted/50 transition-colors', !n.read && 'bg-primary/5')}>
                        <div className="flex items-start gap-3">
                          <span className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-1.5', n.type === 'success' ? 'bg-green-500' : n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500')} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2 ml-1 pl-1 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="hidden md:block text-sm font-medium text-foreground truncate max-w-24">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
