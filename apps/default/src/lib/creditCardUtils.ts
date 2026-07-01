import { v4 as uuidv4 } from 'uuid';
import type { Category, CreditCard } from '../types';

const CARD_PARENT_CATEGORY_NAME = 'Cartão de Crédito';

// invoiceMonth (YYYY-MM-01) e due_date sempre caem no mesmo mês/ano — mesma
// convenção usada na migração dos lançamentos existentes do Sicoob.
export function computeInvoiceDueDate(card: CreditCard, invoiceMonth: string): string {
  const [y, m] = invoiceMonth.split('-');
  const dd = String(card.dueDay).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function getCardParentCategory(categories: Category[], companyId: string): Category | undefined {
  return categories.find(c => c.name === CARD_PARENT_CATEGORY_NAME && !c.parentId && c.type === 'despesa' && c.companyId === companyId);
}

// Garante que existe a categoria "Cartão de Crédito" para a empresa (cria se
// a empresa foi criada antes do trigger de categorias padrão existir).
// Retorna o categoryId a usar na transaction agregada da fatura — arquitetura
// confirmada: NÃO cria subcategoria com o nome do cartão. Subcategorias dentro
// de "Cartão de Crédito" são criadas manualmente pelo usuário, por tipo de
// gasto (ex: Alimentação, Vestuário, Assinaturas).
export function getOrCreateCartaoCreditoCategory(
  companyId: string,
  categories: Category[],
  addCategory: (c: Category) => void
): string {
  const existing = getCardParentCategory(categories, companyId);
  if (existing) return existing.id;
  const id = uuidv4();
  addCategory({ id, name: CARD_PARENT_CATEGORY_NAME, type: 'despesa', color: '#6366f1', companyId, active: true });
  return id;
}
