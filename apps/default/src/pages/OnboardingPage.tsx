import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Landmark, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useAuthStore, useAppStore } from '../store/useStore';
import { formatCNPJMask } from '../lib/utils';
import { toast } from 'sonner';
import type { Company, BankAccount } from '../types';

const STEPS = ['Sua Empresa', 'Conta Bancária', 'Saldo Inicial'];
const SEGMENTS = ['Comércio', 'Indústria', 'Serviços', 'Tecnologia', 'Saúde', 'Educação', 'Agronegócio', 'Construção', 'Alimentação', 'Outro'];
const BANKS = ['Itaú', 'Bradesco', 'Banco do Brasil', 'Santander', 'Caixa Econômica', 'Nubank', 'Inter', 'Sicoob', 'Sicredi', 'Outro'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setOnboardingComplete } = useAuthStore();
  const { updateCompany, addBankAccount } = useAppStore();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: '', cnpj: '', segment: '',
    bankName: '', bankAgency: '', bankAccount: '',
    bankAccountType: 'corrente' as 'corrente' | 'poupanca',
    openingBalance: '',
  });

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const formatBalance = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const canNext = () => {
    if (step === 0) return form.companyName.trim().length >= 2;
    if (step === 1) return form.bankName.trim().length >= 2;
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const companyId = user?.companyId || 'company-001';
      updateCompany({ id: companyId, name: form.companyName, cnpj: form.cnpj, segment: form.segment } as Partial<Company>);
      if (form.bankName) {
        const bal = parseFloat(form.openingBalance.replace(/\./g, '').replace(',', '.')) || 0;
        addBankAccount({ id: `bank-${Date.now()}`, name: `Conta ${form.bankName}`, bank: form.bankName, agency: form.bankAgency, account: form.bankAccount, type: form.bankAccountType, balance: bal, initialBalance: bal, companyId } as BankAccount);
      }
      setOnboardingComplete(true);
      setDone(true);
    } catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-700 to-blue-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md w-full animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tudo configurado! 🎉</h2>
          <p className="text-gray-500 mb-2"><span className="font-semibold text-gray-700">{form.companyName}</span> está pronta.</p>
          <p className="text-gray-400 text-sm mb-8">Seu painel financeiro completo está aguardando.</p>
          <button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all">
            Ir para o Dashboard <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Bem-vindo ao SuaEmpresa Gestão!</h1>
          <p className="text-blue-200 mt-2">Configure em {STEPS.length} passos rápidos</p>
        </div>
        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 transition-all ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < step ? 'bg-green-400 text-white' : i === step ? 'bg-white text-blue-700' : 'bg-white/20 text-white'}`}>
                  {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:block ${i === step ? 'text-white font-semibold' : 'text-blue-200'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 max-w-16 ${i < step ? 'bg-green-400' : 'bg-white/20'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                  <div><h2 className="text-xl font-bold text-gray-900">Dados da Empresa</h2><p className="text-gray-500 text-sm">Informações básicas do seu negócio</p></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Empresa *</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Distribuidora Brasil Ltda." value={form.companyName} onChange={e => upd('companyName', e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
                  <input className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => upd('cnpj', formatCNPJMask(e.target.value))} maxLength={18} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Segmento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {SEGMENTS.map(seg => (
                      <button key={seg} onClick={() => upd('segment', seg)} className={`px-3 py-2 rounded-lg text-sm border transition-all ${form.segment === seg ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>{seg}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><Landmark className="w-5 h-5 text-green-600" /></div>
                  <div><h2 className="text-xl font-bold text-gray-900">Conta Bancária Principal</h2><p className="text-gray-500 text-sm">Vincule para sincronizar extratos</p></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banco *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BANKS.map(bank => (
                      <button key={bank} onClick={() => upd('bankName', bank)} className={`px-3 py-2 rounded-lg text-sm border transition-all ${form.bankName === bank ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>{bank}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Agência</label><input className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0001" value={form.bankAgency} onChange={e => upd('bankAgency', e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Conta</label><input className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="12345-6" value={form.bankAccount} onChange={e => upd('bankAccount', e.target.value)} /></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <div className="flex gap-3">
                    {[['corrente','Conta Corrente'],['poupanca','Poupança']].map(([val,lbl]) => (
                      <button key={val} onClick={() => upd('bankAccountType', val)} className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${form.bankAccountType === val ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>{lbl}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><span className="text-purple-600 text-lg font-bold">R$</span></div>
                  <div><h2 className="text-xl font-bold text-gray-900">Saldo de Abertura</h2><p className="text-gray-500 text-sm">Qual o saldo atual na conta?</p></div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <p className="text-sm text-gray-500 mb-3">{form.bankName || 'Sua conta'}</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl text-gray-400 font-medium">R$</span>
                    <input className="text-4xl font-bold text-gray-900 bg-transparent outline-none text-center w-48" placeholder="0,00" value={form.openingBalance} onChange={e => upd('openingBalance', formatBalance(e.target.value))} inputMode="numeric" autoFocus />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Ajustável depois em Configurações</p>
                </div>
              </div>
            )}
          </div>
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/login')} className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Login' : 'Anterior'}
            </button>
            <div className="flex items-center gap-3">
              {step < 2 && <button onClick={() => setStep(s => s + 1)} className="text-sm text-gray-400 hover:text-gray-600">Pular</button>}
              <button onClick={step === 2 ? handleFinish : () => setStep(s => s + 1)} disabled={!canNext() || saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-sm">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {step === 2 ? 'Concluir' : 'Próximo'} {!saving && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
