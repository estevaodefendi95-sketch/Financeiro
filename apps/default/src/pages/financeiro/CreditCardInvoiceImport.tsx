import React, { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import InlineCategoryEditor from '../../components/ui/InlineCategoryEditor';
import { useAppStore } from '../../store/useStore';
import { formatCurrency, formatDate, toISODate } from '../../lib/utils';
import { getOrCreateCartaoCreditoCategory, getCardParentCategory, computeInvoiceDueDate } from '../../lib/creditCardUtils';
import { parseCreditCardInvoicePDF, type ParsedInvoiceItem } from '../../lib/claude';
import type { CreditCardItem, CategoryRule, Transaction } from '../../types';

interface ReviewItem extends ParsedInvoiceItem {
  id: string;
  categoryId?: string;
}

function parseBRAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;
  if (cleaned.includes(',')) return Math.abs(parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))) || 0;
  return Math.abs(parseFloat(cleaned)) || 0;
}

function extractInstallment(description: string): { installmentNumber?: number; totalInstallments?: number } {
  const m = description.match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return {};
  return { installmentNumber: parseInt(m[1], 10), totalInstallments: parseInt(m[2], 10) };
}

// Parser de OFX/QFX via regex sobre os blocos <STMTTRN> (mesma estrutura usada
// em extrato bancário). Faturas de cartão de alguns bancos podem variar o
// formato — validar contra um arquivo real antes de confiar 100%.
function parseOFXItems(text: string): ParsedInvoiceItem[] {
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
  const items: ParsedInvoiceItem[] = [];
  for (const block of blocks) {
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/i);
    const amountMatch = block.match(/<TRNAMT>(-?[\d.]+)/i);
    if (!dateMatch || !amountMatch) continue;
    const nameMatch = block.match(/<NAME>([^\n<]+)/i) || block.match(/<MEMO>([^\n<]+)/i);
    const raw = dateMatch[1];
    const description = (nameMatch?.[1] || 'Compra').trim();
    items.push({
      purchaseDate: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
      description,
      amount: Math.abs(parseFloat(amountMatch[1])),
      ...extractInstallment(description),
    });
  }
  return items;
}

async function parseCSVItems(file: File): Promise<ParsedInvoiceItem[]> {
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data.filter(r => Object.keys(r).length > 0);
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);
  const dateKey = headers.find(h => /data|date/i.test(h)) || headers[0];
  const descKey = headers.find(h => /desc|hist|estabelecimento|lan[cç]amento/i.test(h)) || headers[1];
  const amountKey = headers.find(h => /valor|amount|value/i.test(h)) || headers[2];
  return rows
    .filter(r => r[dateKey] && r[amountKey])
    .map(r => {
      const description = (r[descKey] || 'Compra').trim();
      return {
        purchaseDate: toISODate(r[dateKey]),
        description,
        amount: parseBRAmount(r[amountKey]),
        ...extractInstallment(description),
      };
    });
}

function suggestCategoryId(description: string, rules: CategoryRule[]): string | undefined {
  const desc = description.toLowerCase();
  const matches = rules.filter(r => r.pattern && desc.includes(r.pattern.toLowerCase()));
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => b.timesApplied - a.timesApplied);
  return matches[0].categoryId;
}

function normalizeDescription(desc: string): string {
  return desc.trim().toLowerCase().replace(/\s+/g, ' ');
}

function itemDedupKey(i: { installmentNumber?: number; totalInstallments?: number; description: string }): string {
  return `${i.installmentNumber ?? ''}|${i.totalInstallments ?? ''}|${normalizeDescription(i.description)}`;
}

function currentInvoiceMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

interface Props {
  creditCardId: string;
  onDone: () => void;
  onClose: () => void;
}

export default function CreditCardInvoiceImport({ creditCardId, onDone, onClose }: Props) {
  const { creditCards, categories, categoryRules, company, creditCardItems, addCategory, bulkAddCreditCardItems, addTransaction } = useAppStore();
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [invoiceMonth, setInvoiceMonth] = useState(currentInvoiceMonth());
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const card = creditCards.find(c => c.id === creditCardId);
  const despesaCategories = useMemo(() => categories.filter(c => c.type === 'despesa' || c.type === 'both'), [categories]);
  const cartaoCreditoCategoryId = useMemo(() => getCardParentCategory(categories, company.id)?.id, [categories, company.id]);
  const total = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);

  const handleFile = async (file: File) => {
    setStep('processing');
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsed: ParsedInvoiceItem[] = [];
      if (ext === 'ofx' || ext === 'qfx') {
        parsed = parseOFXItems(await file.text());
      } else if (ext === 'csv') {
        parsed = await parseCSVItems(file);
      } else if (ext === 'pdf') {
        const content = await file.text();
        parsed = await parseCreditCardInvoicePDF(content, card?.name || 'Cartão');
      } else {
        toast.error('Formato não suportado. Use OFX, QFX, CSV ou PDF.');
        setStep('upload');
        return;
      }
      if (parsed.length === 0) {
        toast.error('Nenhuma compra encontrada no arquivo.');
        setStep('upload');
        return;
      }
      setItems(parsed.map(p => ({
        ...p,
        id: uuidv4(),
        categoryId: suggestCategoryId(p.description, categoryRules),
      })));
      setStep('review');
    } catch (e) {
      console.error(e);
      toast.error('Não consegui processar o arquivo. Tente novamente.');
      setStep('upload');
    }
  };

  const updateItemCategory = (id: string, categoryId: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, categoryId } : i));
  };

  const handleConfirm = () => {
    if (!card) return;
    const cardCategoryId = getOrCreateCartaoCreditoCategory(company.id, categories, addCategory);
    const dueDate = computeInvoiceDueDate(card, invoiceMonth);

    // Uma parcela já lançada (mesmo cartão/mês + installment_number/total_installments
    // + descrição normalizada) não deve ser duplicada ao reimportar a mesma fatura.
    const existingKeys = new Set(
      creditCardItems
        .filter(ci => ci.creditCardId === card.id && ci.invoiceMonth === invoiceMonth)
        .map(itemDedupKey)
    );
    const newItems = items.filter(i => !existingKeys.has(itemDedupKey(i)));
    const skipped = items.length - newItems.length;

    const cardItems: CreditCardItem[] = newItems.map(i => ({
      id: i.id,
      companyId: company.id,
      creditCardId: card.id,
      invoiceMonth,
      description: i.description,
      originalDescription: i.description,
      amount: i.amount,
      purchaseDate: i.purchaseDate,
      installmentNumber: i.installmentNumber,
      totalInstallments: i.totalInstallments,
      categoryId: i.categoryId,
    }));
    if (cardItems.length > 0) bulkAddCreditCardItems(cardItems);

    const [y, m] = invoiceMonth.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const invoiceTx: Transaction = {
      id: uuidv4(),
      type: 'despesa',
      description: `Fatura ${card.name} ${monthNames[parseInt(m, 10) - 1]}/${y}`,
      amount: total,
      dueDate,
      status: 'pendente',
      creditCardId: card.id,
      categoryId: cardCategoryId,
      recurrence: 'unico',
      companyId: company.id,
      createdAt: new Date().toISOString(),
    };
    addTransaction(invoiceTx);

    toast.success(
      skipped > 0
        ? `Fatura importada: ${cardItems.length} itens novos, ${skipped} já existentes ignorados, total ${formatCurrency(total)}`
        : `Fatura importada: ${items.length} itens, ${formatCurrency(total)}`
    );
    onDone();
  };

  return (
    <Modal open onClose={onClose} title={`Importar Fatura — ${card?.name || ''}`} size="xl">
      {step === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Arraste e solte a fatura</h3>
          <p className="text-muted-foreground text-sm mb-4">Suporta OFX, QFX, CSV e PDF</p>
          <label className="cursor-pointer px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors">
            Selecionar Arquivo
            <input ref={inputRef} type="file" accept=".ofx,.qfx,.pdf,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
        </div>
      )}

      {step === 'processing' && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
          <h3 className="font-semibold text-foreground text-lg mb-2">Processando fatura...</h3>
          <p className="text-muted-foreground text-sm">Extraindo compras e sugerindo categorias</p>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Mês da fatura</label>
              <input
                type="month"
                value={invoiceMonth.slice(0, 7)}
                onChange={e => setInvoiceMonth(`${e.target.value}-01`)}
                className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              {items.length} itens · vencimento previsto {card && formatDate(computeInvoiceDueDate(card, invoiceMonth))}
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {items.map(item => (
                <div key={item.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-20 flex-shrink-0">{formatDate(item.purchaseDate)}</span>
                  <span className="flex-1 min-w-0 truncate text-foreground" title={item.description}>{item.description}</span>
                  {item.installmentNumber && <span className="text-xs text-muted-foreground flex-shrink-0">{item.installmentNumber}/{item.totalInstallments}</span>}
                  <InlineCategoryEditor
                    value={item.categoryId || cartaoCreditoCategoryId}
                    categories={despesaCategories}
                    lockedParentId={cartaoCreditoCategoryId}
                    onChange={categoryId => updateItemCategory(item.id, categoryId)}
                  />
                  <span className="font-semibold text-foreground w-24 text-right flex-shrink-0">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-muted/40 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total da fatura</span>
              <span className="font-bold text-foreground">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">Voltar</button>
            <button onClick={handleConfirm} className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors shadow-sm">Importar {items.length} itens</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
