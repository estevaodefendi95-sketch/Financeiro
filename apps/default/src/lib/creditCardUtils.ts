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

// Garante que existe uma subcategoria com o nome do cartão, filha de "Cartão de
// Crédito" (cria a categoria pai também se a empresa ainda não tiver uma).
// Retorna o categoryId a usar na transaction agregada da fatura.
export function getOrCreateCardCategory(
  card: CreditCard,
  categories: Category[],
  addCategory: (c: Category) => void
): string {
  let parent = getCardParentCategory(categories, card.companyId);
  if (!parent) {
    parent = { id: uuidv4(), name: CARD_PARENT_CATEGORY_NAME, type: 'despesa', color: '#6366f1', companyId: card.companyId, active: true };
    addCategory(parent);
  }
  const existing = categories.find(c => c.parentId === parent!.id && c.name === card.name);
  if (existing) return existing.id;
  const id = uuidv4();
  addCategory({ id, name: card.name, type: 'despesa', color: card.color || '#6366f1', parentId: parent.id, companyId: card.companyId, active: true });
  return id;
}
