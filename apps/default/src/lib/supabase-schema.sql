-- ============================================================
-- SUAEMPRESA GESTÃO ERP — Supabase Schema
-- Cole este script no SQL Editor do Supabase e execute
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── COMPANIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','financeiro','vendas')),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHART OF ACCOUNTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita','despesa')),
  parent_id UUID REFERENCES chart_of_accounts(id),
  active BOOLEAN DEFAULT TRUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BANK ACCOUNTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  agency TEXT,
  account TEXT,
  type TEXT NOT NULL CHECK (type IN ('corrente','poupanca','investimento')),
  balance NUMERIC(15,2) DEFAULT 0,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRANSACTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('receita','despesa')),
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  due_date DATE,                          -- NULLABLE: pendências sem previsão de pagamento (ver is_undated)
  is_undated BOOLEAN NOT NULL DEFAULT FALSE, -- pendência bancária sem data de vencimento definida
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','vencido','recebido','cancelado')),
  category TEXT,
  category_id UUID REFERENCES chart_of_accounts(id),
  supplier_id UUID,
  customer_id UUID,
  supplier_name TEXT,
  customer_name TEXT,
  payment_method TEXT CHECK (payment_method IN ('dinheiro','pix','cartao_credito','cartao_debito','transferencia','boleto','cheque')),
  bank_account_id UUID REFERENCES bank_accounts(id),
  cost_center TEXT,
  recurrence TEXT DEFAULT 'nenhuma' CHECK (recurrence IN ('nenhuma','diaria','semanal','mensal','anual')),
  notes TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Cartão de crédito: transaction agregada da fatura (1 por mês/cartão). Compras
  -- individuais NÃO vão mais aqui — ver credit_card_items abaixo.
  credit_card_id UUID REFERENCES credit_cards(id),
  installment_number INT,
  total_installments INT,
  card_invoice_date DATE
);

-- ── CREDIT CARDS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  credit_limit NUMERIC(15,2),
  closing_day INT,
  due_day INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_four_digits TEXT,
  color TEXT DEFAULT '#6366f1',
  statement_match_pattern TEXT, -- usado para reconhecer o débito da fatura no extrato bancário
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CREDIT CARD ITEMS ───────────────────────────────────────
-- Compras individuais do cartão: aparecem na tela do cartão e na DRE por
-- categoria, mas NÃO no Calendário de Caixa nem em Contas a Pagar (só a
-- transaction agregada da fatura, em `transactions.credit_card_id`, aparece lá).
CREATE TABLE IF NOT EXISTS credit_card_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id),
  invoice_month DATE NOT NULL, -- mês de referência da fatura, sempre dia=01
  description VARCHAR NOT NULL,
  original_description TEXT,
  amount NUMERIC NOT NULL,
  purchase_date DATE NOT NULL,
  installment_number INT,
  total_installments INT,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CUSTOMERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'pessoa_fisica' CHECK (type IN ('pessoa_fisica','pessoa_juridica')),
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  credit_limit NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT,
  category TEXT,
  type TEXT NOT NULL DEFAULT 'produto' CHECK (type IN ('produto','servico')),
  unit_price NUMERIC(15,2) DEFAULT 0,
  cost_price NUMERIC(15,2) DEFAULT 0,
  unit TEXT DEFAULT 'un',
  stock NUMERIC(15,3) DEFAULT 0,
  min_stock NUMERIC(15,3) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SALES ORDERS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','confirmado','entregue','cancelado')),
  subtotal NUMERIC(15,2) DEFAULT 0,
  discount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SALES ORDER ITEMS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  discount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL
);

-- ── STOCK MOVEMENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada','saida','ajuste')),
  quantity NUMERIC(15,3) NOT NULL,
  previous_stock NUMERIC(15,3) NOT NULL,
  new_stock NUMERIC(15,3) NOT NULL,
  reason TEXT,
  order_id UUID,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BANK STATEMENTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  balance NUMERIC(15,2),
  matched BOOLEAN DEFAULT FALSE,
  transaction_id UUID REFERENCES transactions(id),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
-- Para começar sem RLS (desenvolvimento), execute:
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements DISABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts DISABLE ROW LEVEL SECURITY;

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card ON transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_items_card_month ON credit_card_items(credit_card_id, invoice_month);
CREATE INDEX IF NOT EXISTS idx_credit_card_items_company ON credit_card_items(company_id);
