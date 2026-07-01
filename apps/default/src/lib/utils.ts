import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Sem data';
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (isNaN(d.getTime())) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

export function formatCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '');
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatDocument(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  if (digits.length <= 11) return formatCPF(digits);
  return formatCNPJ(digits);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function maskPhone(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})$/, '$1-$2').slice(0, 15);
}

export function maskZipCode(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

export function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  return due < today;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getMonthName(month: number): string {
  return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][month];
}

export function getMonthFullName(month: number): string {
  return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][month];
}

export function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    agendado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    pago: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    recebido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    atrasado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    vencido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    cancelado: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    aguardando_aprovacao: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    rascunho: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    entregue: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    entrada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    saida: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    ajuste: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pendente: 'Pendente',
    agendado: 'Agendado',
    pago: 'Pago',
    recebido: 'Recebido',
    atrasado: 'Atrasado',
    cancelado: 'Cancelado',
    aguardando_aprovacao: 'Ag. Aprovação',
    rascunho: 'Rascunho',
    confirmado: 'Confirmado',
    entregue: 'Entregue',
  };
  return map[status] || status;
}

export function getPaymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    pix: 'PIX', boleto: 'Boleto', cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito', transferencia: 'Transferência',
    dinheiro: 'Dinheiro', cheque: 'Cheque', ted: 'TED', doc: 'DOC',
  };
  return map[method] || method;
}

export function toISODate(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return ddmmyyyy;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export function fromISODate(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function formatCNPJMask(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}


// Re-export from types for convenience
export { computeStatus, daysOverdue } from '../types';
