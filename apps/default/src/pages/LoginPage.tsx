import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('demo@empresa.com.br');
  const [password, setPassword] = useState('demo123');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Bem-vindo de volta!');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  const features = [
    { icon: TrendingUp, title: 'Fluxo de Caixa em Tempo Real', desc: 'Visão completa das suas finanças com projeções de 90 dias' },
    { icon: Shield, title: 'Conciliação Bancária com IA', desc: 'Importe extratos OFX e reconcilie automaticamente' },
    { icon: Zap, title: 'Cobranças Automáticas', desc: 'Régua de cobrança por WhatsApp e e-mail para inadimplentes' },
  ];

  return (
    <div className="min-h-screen bg-[#0d47a1] flex">
      {/* Left Branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/60 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">SuaEmpresa Gestão</span>
          </div>
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white leading-tight mb-5">
              ERP Financeiro para PMEs brasileiras
            </h1>
            <p className="text-blue-200 text-xl leading-relaxed">
              Controle total do seu dinheiro: contas a pagar e receber, fluxo de caixa, conciliação bancária e relatórios gerenciais.
            </p>
          </div>
          <div className="space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white/8 rounded-2xl p-4 border border-white/10">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-blue-200 text-sm mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-blue-300 text-sm">© 2025 SuaEmpresa Gestão · Todos os direitos reservados</p>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">SuaEmpresa Gestão</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Entrar na sua conta</h2>
            <p className="text-gray-500 text-sm mb-7">Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">demo@empresa.com.br</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">demo123</code></p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="seu@email.com.br" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Esqueci minha senha</button>
              </div>
              <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1565C0] hover:bg-blue-800 text-white rounded-xl font-semibold transition-all disabled:opacity-60 shadow-sm mt-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                Não tem conta?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">Criar conta grátis</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
