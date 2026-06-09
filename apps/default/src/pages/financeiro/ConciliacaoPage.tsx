import React, { useState } from 'react';
import { Upload, GitMerge, FileText, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { toast } from 'sonner';

export default function ConciliacaoPage() {
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const { bankStatements } = useAppStore();

  const steps = ['Upload', 'Processar', 'Revisar', 'Conciliar', 'Concluído'];

  const handleFile = (file: File) => {
    toast.success(`Arquivo "${file.name}" recebido. Processamento com IA em breve!`);
    setStep(1);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><GitMerge className="w-6 h-6 text-primary" />Conciliação Bancária</h1><p className="text-muted-foreground text-sm">Importe extratos OFX ou PDF e concilie automaticamente</p></div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i < step ? '✓' : i + 1}</div>
              <span className={`text-sm ${i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 min-w-4 ${i < step ? 'bg-green-500' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Arraste e solte o extrato bancário</h3>
          <p className="text-muted-foreground text-sm mb-4">Suporta OFX, QFX e PDF</p>
          <label className="cursor-pointer px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors">
            Selecionar Arquivo
            <input type="file" accept=".ofx,.qfx,.pdf,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
          <p className="text-xs text-muted-foreground mt-4">Extrato OFX: correspondência automática por ID · PDF: IA Claude extrai as transações</p>
        </div>
      )}

      {step > 0 && step < 4 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
          <h3 className="font-semibold text-foreground text-lg mb-2">Processando extrato...</h3>
          <p className="text-muted-foreground text-sm">A IA Claude está analisando as transações. Integração completa disponível na Phase 2.</p>
          <button onClick={() => setStep(0)} className="mt-4 px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors">Voltar</button>
        </div>
      )}
    </div>
  );
}
