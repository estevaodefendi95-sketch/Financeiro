import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User, Company, Transaction, Customer, Product, SalesOrder,
  StockMovement, BankAccount, Category, BankStatementLine,
  CostCenter, CreditCard, CreditCardItem, Supplier, CategoryRule,
  NameRule as NameRuleType, Notification
} from '../types';
import { computeStatus } from '../types';
import { sbInsert, sbUpdate, sbDelete, sbSelect, setSupabaseToken, supabaseAuthApi, toSnake, mapRows } from '../lib/supabase';
import { seedData } from '../data/seed';

// ── Auth ─────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  supabaseToken: string | null;
  onboardingComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ needsOnboarding: boolean }>;
  logout: () => void;
  setOnboardingComplete: (v: boolean) => void;
  updateUser: (u: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      supabaseToken: null,
      onboardingComplete: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await supabaseAuthApi.post('/token?grant_type=password', { email, password });
          setSupabaseToken(data.access_token);
          const meta = data.user?.user_metadata ?? {};
          set({
            user: { id: data.user.id, email: data.user.email, name: meta.name ?? email.split('@')[0], role: meta.role ?? 'admin', companyId: meta.company_id ?? '', onboardingComplete: meta.onboarding_complete ?? false },
            supabaseToken: data.access_token, isAuthenticated: true, isLoading: false,
            onboardingComplete: meta.onboarding_complete ?? false,
          });
        } catch {
          // Demo fallback
          await new Promise(r => setTimeout(r, 400));
          if (email && password.length >= 6) {
            const seed = seedData();
            useAppStore.getState().hydrate(seed);
            set({ user: { id: 'user-demo', email, name: 'Administrador Demo', role: 'admin', companyId: 'company-001', onboardingComplete: true }, isAuthenticated: true, isLoading: false, supabaseToken: null, onboardingComplete: true });
          } else { set({ isLoading: false }); throw new Error('Credenciais inválidas'); }
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await supabaseAuthApi.post('/signup', { email, password, data: { name, role: 'admin', onboarding_complete: false } });
          if (data.access_token) setSupabaseToken(data.access_token);
          set({ user: { id: data.user?.id ?? 'user-001', email, name, role: 'admin', companyId: '', onboardingComplete: false }, isAuthenticated: true, isLoading: false, supabaseToken: data.access_token ?? null, onboardingComplete: false });
          return { needsOnboarding: true };
        } catch {
          await new Promise(r => setTimeout(r, 600));
          set({ user: { id: 'user-demo', email, name, role: 'admin', companyId: 'company-001', onboardingComplete: false }, isAuthenticated: true, isLoading: false, supabaseToken: null, onboardingComplete: false });
          return { needsOnboarding: true };
        }
      },

      logout: () => { setSupabaseToken(null); set({ user: null, isAuthenticated: false, supabaseToken: null, onboardingComplete: false }); },
      setOnboardingComplete: (v) => { set({ onboardingComplete: v }); const u = get().user; if (u) set({ user: { ...u, onboardingComplete: v } }); },
      updateUser: (u) => { const cur = get().user; if (cur) set({ user: { ...cur, ...u } }); },
    }),
    { name: 'auth-v2' }
  )
);

// ── App State ─────────────────────────────────────────────────

interface AppState {
  company: Company;
  transactions: Transaction[];
  customers: Customer[];
  products: Product[];
  salesOrders: SalesOrder[];
  stockMovements: StockMovement[];
  bankAccounts: BankAccount[];
  categories: Category[];
  bankStatements: BankStatementLine[];
  costCenters: CostCenter[];
  creditCards: CreditCard[];
  creditCardItems: CreditCardItem[];
  suppliers: Supplier[];
  categoryRules: CategoryRule[];
  nameRules: NameRuleType[];
  notifications: Notification[];
  isDbConnected: boolean;

  hydrate: (data: ReturnType<typeof seedData>) => void;
  loadFromSupabase: (companyId?: string) => Promise<void>;

  // Computed
  getTransactionsWithStatus: () => Transaction[];

  // Company
  updateCompany: (c: Partial<Company>) => void;

  // Transactions
  addTransaction: (t: Transaction) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  bulkUpdateStatus: (ids: string[], status: Transaction['status']) => void;

  // Customers
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Products
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Sales Orders
  addSalesOrder: (o: SalesOrder) => void;
  updateSalesOrder: (id: string, o: Partial<SalesOrder>) => void;
  deleteSalesOrder: (id: string) => void;

  // Stock
  addStockMovement: (m: StockMovement) => void;

  // Bank Accounts
  addBankAccount: (b: BankAccount) => void;
  updateBankAccount: (id: string, b: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;

  // Categories
  addCategory: (c: Category) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Bank Statements
  addBankStatements: (lines: BankStatementLine[]) => void;
  matchStatement: (stmtId: string, txnId: string) => void;
  unmatchStatement: (stmtId: string) => void;

  // Cost Centers
  addCostCenter: (c: CostCenter) => void;
  updateCostCenter: (id: string, c: Partial<CostCenter>) => void;
  deleteCostCenter: (id: string) => void;

  // Credit Cards
  addCreditCard: (c: CreditCard) => void;
  updateCreditCard: (id: string, c: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;

  // Credit Card Items
  addCreditCardItem: (i: CreditCardItem) => void;
  bulkAddCreditCardItems: (items: CreditCardItem[]) => void;
  updateCreditCardItem: (id: string, i: Partial<CreditCardItem>) => void;
  deleteCreditCardItem: (id: string) => void;

  // Suppliers
  addSupplier: (s: Supplier) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Category Rules
  addCategoryRule: (r: CategoryRule) => void;
  updateCategoryRule: (id: string, r: Partial<CategoryRule>) => void;

  // Name Rules
  addNameRule: (r: NameRuleType) => void;
  updateNameRule: (id: string, r: Partial<NameRuleType>) => void;
  deleteNameRule: (id: string) => void;

  // Notifications
  addNotification: (n: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
}

const sb = <T>(table: string, data: Record<string, unknown>) => {
  sbInsert<T>(table, toSnake(data)).catch(e => console.warn('[sb insert]', table, e));
};
const sbUp = <T>(table: string, id: string, data: Record<string, unknown>) => {
  sbUpdate<T>(table, id, toSnake(data)).catch(e => console.warn('[sb update]', table, e));
};
const sbDel = (table: string, id: string) => {
  sbDelete(table, id).catch(e => console.warn('[sb delete]', table, e));
};
const sbBulk = <T>(table: string, rows: Record<string, unknown>[]) => {
  sbInsert<T>(table, rows.map(toSnake) as unknown as Partial<T>).catch(e => console.warn('[sb bulk insert]', table, e));
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const seed = seedData();
      return {
        company: seed.company,
        transactions: seed.transactions,
        customers: seed.customers,
        products: seed.products,
        salesOrders: seed.salesOrders,
        stockMovements: seed.stockMovements,
        bankAccounts: seed.bankAccounts,
        categories: seed.categories,
        bankStatements: [],
        costCenters: seed.costCenters,
        creditCards: [],
        creditCardItems: [],
        suppliers: [],
        categoryRules: [],
        nameRules: [],
        notifications: seed.notifications,
        isDbConnected: false,

        hydrate: (data) => set({
          company: data.company, transactions: data.transactions, customers: data.customers,
          products: data.products, salesOrders: data.salesOrders, stockMovements: data.stockMovements,
          bankAccounts: data.bankAccounts, categories: data.categories, costCenters: data.costCenters,
          notifications: data.notifications,
        }),

        loadFromSupabase: async (companyId?) => {
          try {
            const p: Record<string, string> = { order: 'created_at.desc' };
            if (companyId && companyId !== 'company-001') p['company_id'] = `eq.${companyId}`;
            const cp = (companyId && companyId !== 'company-001') ? { company_id: `eq.${companyId}` } : {};
            const [txns, custs, prods, cats, banks, cards, cardItems, sups, catRules] = await Promise.all([
              sbSelect<Record<string, unknown>>('transactions', p),
              sbSelect<Record<string, unknown>>('customers', { order: 'name.asc', ...cp }),
              sbSelect<Record<string, unknown>>('products', { order: 'name.asc', ...cp }),
              sbSelect<Record<string, unknown>>('categories', { order: 'name.asc', ...cp }),
              sbSelect<Record<string, unknown>>('bank_accounts', cp),
              sbSelect<Record<string, unknown>>('credit_cards', { order: 'name.asc', ...cp }),
              sbSelect<Record<string, unknown>>('credit_card_items', { order: 'invoice_month.desc', ...cp }),
              sbSelect<Record<string, unknown>>('suppliers', { order: 'name.asc', ...cp }),
              sbSelect<Record<string, unknown>>('category_rules', cp),
            ]);
            set({
              isDbConnected: true,
              ...(txns.length > 0 && { transactions: mapRows<Transaction>(txns) }),
              ...(custs.length > 0 && { customers: mapRows<Customer>(custs) }),
              ...(prods.length > 0 && { products: mapRows<Product>(prods) }),
              ...(cats.length > 0 && { categories: mapRows<Category>(cats) }),
              ...(banks.length > 0 && { bankAccounts: mapRows<BankAccount>(banks) }),
              ...(cards.length > 0 && { creditCards: mapRows<CreditCard>(cards) }),
              ...(cardItems.length > 0 && { creditCardItems: mapRows<CreditCardItem>(cardItems) }),
              ...(sups.length > 0 && { suppliers: mapRows<Supplier>(sups) }),
              ...(catRules.length > 0 && { categoryRules: mapRows<CategoryRule>(catRules) }),
            });
          } catch (e) { console.warn('[Supabase] offline mode', e); set({ isDbConnected: false }); }
        },

        getTransactionsWithStatus: () => get().transactions.map(t => ({ ...t, status: computeStatus(t) })),

        updateCompany: (c) => set(s => ({ company: { ...s.company, ...c } })),

        addTransaction: (t) => { set(s => ({ transactions: [t, ...s.transactions] })); sb('transactions', t as unknown as Record<string, unknown>); },
        updateTransaction: (id, t) => { set(s => ({ transactions: s.transactions.map(tx => tx.id === id ? { ...tx, ...t } : tx) })); sbUp('transactions', id, t as unknown as Record<string, unknown>); },
        deleteTransaction: (id) => { set(s => ({ transactions: s.transactions.filter(tx => tx.id !== id) })); sbDel('transactions', id); },
        bulkUpdateStatus: (ids, status) => { set(s => ({ transactions: s.transactions.map(tx => ids.includes(tx.id) ? { ...tx, status } : tx) })); },

        addCustomer: (c) => { set(s => ({ customers: [c, ...s.customers] })); sb('customers', c as unknown as Record<string, unknown>); },
        updateCustomer: (id, c) => { set(s => ({ customers: s.customers.map(cx => cx.id === id ? { ...cx, ...c } : cx) })); sbUp('customers', id, c as unknown as Record<string, unknown>); },
        deleteCustomer: (id) => { set(s => ({ customers: s.customers.filter(cx => cx.id !== id) })); sbDel('customers', id); },

        addProduct: (p) => { set(s => ({ products: [p, ...s.products] })); sb('products', p as unknown as Record<string, unknown>); },
        updateProduct: (id, p) => { set(s => ({ products: s.products.map(px => px.id === id ? { ...px, ...p } : px) })); sbUp('products', id, p as unknown as Record<string, unknown>); },
        deleteProduct: (id) => { set(s => ({ products: s.products.filter(px => px.id !== id) })); sbDel('products', id); },

        addSalesOrder: (o) => { set(s => ({ salesOrders: [o, ...s.salesOrders] })); sb('sales_orders', o as unknown as Record<string, unknown>); },
        updateSalesOrder: (id, o) => { set(s => ({ salesOrders: s.salesOrders.map(ox => ox.id === id ? { ...ox, ...o } : ox) })); sbUp('sales_orders', id, o as unknown as Record<string, unknown>); },
        deleteSalesOrder: (id) => { set(s => ({ salesOrders: s.salesOrders.filter(ox => ox.id !== id) })); sbDel('sales_orders', id); },

        addStockMovement: (m) => { set(s => ({ stockMovements: [m, ...s.stockMovements], products: s.products.map(p => p.id === m.productId ? { ...p, stock: m.newStock } : p) })); sb('stock_movements', m as unknown as Record<string, unknown>); },

        addBankAccount: (b) => { set(s => ({ bankAccounts: [...s.bankAccounts, b] })); sb('bank_accounts', b as unknown as Record<string, unknown>); },
        updateBankAccount: (id, b) => { set(s => ({ bankAccounts: s.bankAccounts.map(bx => bx.id === id ? { ...bx, ...b } : bx) })); sbUp('bank_accounts', id, b as unknown as Record<string, unknown>); },
        deleteBankAccount: (id) => { set(s => ({ bankAccounts: s.bankAccounts.filter(bx => bx.id !== id) })); sbDel('bank_accounts', id); },

        addCategory: (c) => { set(s => ({ categories: [...s.categories, c] })); sb('categories', c as unknown as Record<string, unknown>); },
        updateCategory: (id, c) => { set(s => ({ categories: s.categories.map(cx => cx.id === id ? { ...cx, ...c } : cx) })); sbUp('categories', id, c as unknown as Record<string, unknown>); },
        deleteCategory: (id) => { set(s => ({ categories: s.categories.filter(cx => cx.id !== id) })); sbDel('categories', id); },

        addBankStatements: (lines) => set(s => ({ bankStatements: [...s.bankStatements, ...lines] })),
        matchStatement: (stmtId, txnId) => set(s => ({ bankStatements: s.bankStatements.map(st => st.id === stmtId ? { ...st, matched: true, transactionId: txnId } : st) })),
        unmatchStatement: (stmtId) => set(s => ({ bankStatements: s.bankStatements.map(st => st.id === stmtId ? { ...st, matched: false, transactionId: undefined } : st) })),

        addCostCenter: (c) => set(s => ({ costCenters: [...s.costCenters, c] })),
        updateCostCenter: (id, c) => set(s => ({ costCenters: s.costCenters.map(cx => cx.id === id ? { ...cx, ...c } : cx) })),
        deleteCostCenter: (id) => set(s => ({ costCenters: s.costCenters.filter(cx => cx.id !== id) })),

        addCreditCard: (c) => { set(s => ({ creditCards: [...s.creditCards, c] })); sb('credit_cards', c as unknown as Record<string, unknown>); },
        updateCreditCard: (id, c) => { set(s => ({ creditCards: s.creditCards.map(cx => cx.id === id ? { ...cx, ...c } : cx) })); sbUp('credit_cards', id, c as unknown as Record<string, unknown>); },
        deleteCreditCard: (id) => { set(s => ({ creditCards: s.creditCards.filter(cx => cx.id !== id) })); sbDel('credit_cards', id); },

        addCreditCardItem: (i) => { set(s => ({ creditCardItems: [i, ...s.creditCardItems] })); sb('credit_card_items', i as unknown as Record<string, unknown>); },
        bulkAddCreditCardItems: (items) => { set(s => ({ creditCardItems: [...items, ...s.creditCardItems] })); sbBulk('credit_card_items', items as unknown as Record<string, unknown>[]); },
        updateCreditCardItem: (id, i) => { set(s => ({ creditCardItems: s.creditCardItems.map(ix => ix.id === id ? { ...ix, ...i } : ix) })); sbUp('credit_card_items', id, i as unknown as Record<string, unknown>); },
        deleteCreditCardItem: (id) => { set(s => ({ creditCardItems: s.creditCardItems.filter(ix => ix.id !== id) })); sbDel('credit_card_items', id); },

        addSupplier: (sup) => { set(s => ({ suppliers: [sup, ...s.suppliers] })); sb('suppliers', sup as unknown as Record<string, unknown>); },
        updateSupplier: (id, sup) => { set(s => ({ suppliers: s.suppliers.map(sx => sx.id === id ? { ...sx, ...sup } : sx) })); sbUp('suppliers', id, sup as unknown as Record<string, unknown>); },
        deleteSupplier: (id) => { set(s => ({ suppliers: s.suppliers.filter(sx => sx.id !== id) })); sbDel('suppliers', id); },

        addCategoryRule: (r) => { set(s => ({ categoryRules: [r, ...s.categoryRules] })); sb('category_rules', r as unknown as Record<string, unknown>); },
        updateCategoryRule: (id, r) => { set(s => ({ categoryRules: s.categoryRules.map(rx => rx.id === id ? { ...rx, ...r } : rx) })); sbUp('category_rules', id, r as unknown as Record<string, unknown>); },

        addNameRule: (r) => set(s => ({ nameRules: [...s.nameRules, r] })),
        updateNameRule: (id, r) => set(s => ({ nameRules: s.nameRules.map(rx => rx.id === id ? { ...rx, ...r } : rx) })),
        deleteNameRule: (id) => set(s => ({ nameRules: s.nameRules.filter(rx => rx.id !== id) })),

        addNotification: (n) => set(s => ({ notifications: [n, ...s.notifications] })),
        markNotificationRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
        markAllNotificationsRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
        clearNotifications: () => set({ notifications: [] }),
      };
    },
    { name: 'erp-app-v2', partialize: (state) => ({ company: state.company, transactions: state.transactions, customers: state.customers, products: state.products, bankAccounts: state.bankAccounts, categories: state.categories, costCenters: state.costCenters, creditCards: state.creditCards, creditCardItems: state.creditCardItems, suppliers: state.suppliers, categoryRules: state.categoryRules }) }
  )
);
