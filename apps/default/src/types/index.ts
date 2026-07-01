// ============================================================
// CORE TYPES — BRAZILIAN SME ERP
// ============================================================

export type UserRole = 'admin' | 'financeiro' | 'vendas' | 'estoque' | 'contador';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  avatar?: string;
  onboardingComplete?: boolean;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  segment?: string;
  email: string;
  phone: string;
  address: Address;
  logo?: string;
  openingBalance?: number;
  createdAt: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

// ── FINANCIAL ────────────────────────────────────────────────

export type TransactionType = 'receita' | 'despesa' | 'transferencia';
export type TransactionStatus = 'pendente' | 'pago' | 'recebido' | 'atrasado' | 'agendado' | 'cancelado' | 'aguardando_aprovacao';
export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'transferencia' | 'boleto' | 'cheque' | 'ted' | 'doc';
export type RecurrenceType = 'unico' | 'semanal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export interface PixDetails {
  keyType: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  pixKey: string;
  pixQrCode?: string;
}

export interface BoletoDetails {
  barcode: string;
  linhaDigitavel: string;
  boletoduDate?: string;
}

export interface CardDetails {
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard';
  installments: number;
  invoiceDate?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  originalDescription?: string;
  amount: number;
  dueDate: string | null;   // ISO YYYY-MM-DD, null quando isUndated=true
  // Pendência sem data de vencimento definida — NÃO é uma categoria. Aparece
  // só no painel "Pendências sem previsão" de Contas a Pagar, nunca no
  // Calendário, e entra na DRE pelo mês atual. Não confundir com a categoria
  // "Cartão de Crédito" (ver CreditCardItem), que é sobre transactions de
  // fatura total que TÊM data e aparecem normalmente no Calendário/Contas a Pagar.
  isUndated?: boolean;
  paymentDate?: string;
  status: TransactionStatus;
  categoryId?: string;
  categoryName?: string;
  bankAccountId?: string;
  paymentMethod?: PaymentMethod;
  recurrence: RecurrenceType;
  recurrenceGroupId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  costCenterId?: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  attachmentUrl?: string;
  isReconciled?: boolean;
  bankStatementId?: string;
  pixDetails?: PixDetails;
  boletoDetails?: BoletoDetails;
  cardDetails?: CardDetails;
  creditCardId?: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalComment?: string;
  companyId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  agency: string;
  account: string;
  type: 'corrente' | 'poupanca' | 'investimento';
  balance: number;
  initialBalance: number;
  minBalance?: number;
  color?: string;
  companyId: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'both';
  color: string;
  emoji?: string;
  parentId?: string;
  monthlyBudget?: number;
  companyId: string;
  active: boolean;
}

// Keep ChartOfAccount as alias for Category
export type ChartOfAccount = Category;

export interface CostCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  monthlyBudget?: number;
  companyId: string;
}

// ── BANK STATEMENT ───────────────────────────────────────────

export interface BankStatementLine {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  balance?: number;
  matched: boolean;
  transactionId?: string;
  fitid?: string;
  confidence?: number;
  suggestedTransactionId?: string;
  bankAccountId?: string;
  companyId: string;
}

// ── CREDIT CARD ──────────────────────────────────────────────

export interface CreditCard {
  id: string;
  name: string;
  brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard';
  creditLimit?: number;
  closingDay: number;
  dueDay: number;
  isActive?: boolean;
  lastFourDigits?: string;
  color?: string;
  statementMatchPattern?: string; // usado para reconhecer o débito da fatura no extrato bancário
  companyId: string;
  createdAt?: string;
}

// Compra individual do cartão — aparece na tela do cartão e na DRE por
// categoria, mas NÃO no Calendário de Caixa nem em Contas a Pagar. Só a
// transaction agregada da fatura (Transaction.creditCardId, categoria
// "Cartão de Crédito", com dueDate preenchido) aparece lá. Isso é diferente
// de Transaction.isUndated: aquela flag marca despesas sem data definida
// ("Pendências sem previsão"), não tem relação com cartão de crédito.
export interface CreditCardItem {
  id: string;
  companyId: string;
  creditCardId: string;
  invoiceMonth: string;       // ISO YYYY-MM-01 — mês de referência da fatura
  description: string;
  originalDescription?: string;
  amount: number;
  purchaseDate: string;
  installmentNumber?: number;
  totalInstallments?: number;
  categoryId?: string;
  supplierId?: string;
  createdAt?: string;
}

// Regra aprendida de categorização (aplicada por substring da descrição) —
// tabela já existe e é usada no banco (category_rules), frontend ainda não lia.
export interface CategoryRule {
  id: string;
  companyId: string;
  pattern: string;
  categoryId: string;
  timesApplied: number;
  lastApplied?: string;
  createdAt?: string;
}

// ── NAME RULES ───────────────────────────────────────────────

export interface NameRule {
  id: string;
  pattern: string;
  suggestedName: string;
  confidence: number;
  timesApplied: number;
  categoryId?: string;
  companyId: string;
  active: boolean;
  createdAt: string;
}

// ── CUSTOMERS / SUPPLIERS ────────────────────────────────────

export type PersonType = 'pessoa_fisica' | 'pessoa_juridica';

export interface Customer {
  id: string;
  type: PersonType;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: Address;
  creditLimit?: number;
  notes?: string;
  companyId: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  type?: PersonType;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  isActive?: boolean;
  defaultCategoryId?: string;
  defaultPaymentMethod?: string;
  pixKeyType?: string;
  pixKey?: string;
  isEmployee?: boolean;
  baseSalary?: number;
  salaryPaymentDay?: number;
  biweeklyPaymentDay?: number;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── PRODUCTS ─────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  type: 'produto' | 'servico';
  unitPrice: number;
  costPrice: number;
  unit: string;
  stock: number;
  minStock: number;
  active: boolean;
  companyId: string;
  description?: string;
}

// ── SALES ORDERS ─────────────────────────────────────────────

export type OrderStatus = 'rascunho' | 'confirmado' | 'entregue' | 'cancelado';

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  items: SalesOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  companyId: string;
}

// ── INVENTORY ────────────────────────────────────────────────

export type MovementType = 'entrada' | 'saida' | 'ajuste';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  orderId?: string;
  createdAt: string;
  companyId: string;
}

// ── BANK STATEMENT (legacy alias) ────────────────────────────

export type BankStatement = BankStatementLine;

// ── NOTIFICATIONS ────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}

// ── UI ───────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// ── ONBOARDING ───────────────────────────────────────────────

export interface OnboardingData {
  companyName: string;
  cnpj: string;
  segment: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  bankAccountType: 'corrente' | 'poupanca';
  openingBalance: number;
}

// ── HELPERS ──────────────────────────────────────────────────

export function computeStatus(t: Transaction): TransactionStatus {
  if (t.status === 'pago' || t.status === 'recebido' || t.status === 'cancelado' || t.status === 'aguardando_aprovacao') return t.status;
  if (!t.dueDate) return t.status;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0);
  if (due < today) return 'atrasado';
  return t.status;
}

export function daysOverdue(dueDate: string | null | undefined): number {
  if (!dueDate) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return Math.max(0, diff);
}
