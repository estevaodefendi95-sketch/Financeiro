import type {
  Company, Transaction, Customer, Product, SalesOrder,
  StockMovement, BankAccount, Category, CostCenter, Notification
} from '../types';

const y = new Date().getFullYear();
const m = String(new Date().getMonth() + 1).padStart(2, '0');

function d(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
}

export function seedData() {
  const company: Company = {
    id: 'company-001', name: 'Distribuidora Brasil Ltda.', cnpj: '12.345.678/0001-95',
    segment: 'Comércio', email: 'contato@distribuidorabrasil.com.br', phone: '(11) 98765-4321',
    address: { street: 'Av. Paulista', number: '1000', complement: 'Sala 502', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', zipCode: '01310-100' },
    openingBalance: 48750.50, createdAt: `${y}-01-01`,
  };

  const categories: Category[] = [
    { id: 'cat-r1', name: 'Vendas de Produtos', type: 'receita', color: '#22c55e', emoji: '📦', companyId: 'company-001', active: true, monthlyBudget: 80000 },
    { id: 'cat-r2', name: 'Prestação de Serviços', type: 'receita', color: '#16a34a', emoji: '🔧', companyId: 'company-001', active: true, monthlyBudget: 20000 },
    { id: 'cat-r3', name: 'Juros e Rendimentos', type: 'receita', color: '#15803d', emoji: '💰', companyId: 'company-001', active: true },
    { id: 'cat-r4', name: 'Outras Receitas', type: 'receita', color: '#166534', emoji: '➕', companyId: 'company-001', active: true },
    { id: 'cat-d1', name: 'Salários e Encargos', type: 'despesa', color: '#ef4444', emoji: '👥', companyId: 'company-001', active: true, monthlyBudget: 25000 },
    { id: 'cat-d2', name: 'Aluguel', type: 'despesa', color: '#dc2626', emoji: '🏢', companyId: 'company-001', active: true, monthlyBudget: 8000 },
    { id: 'cat-d3', name: 'Fornecedores', type: 'despesa', color: '#f97316', emoji: '🏭', companyId: 'company-001', active: true, monthlyBudget: 30000 },
    { id: 'cat-d4', name: 'Marketing e Publicidade', type: 'despesa', color: '#a855f7', emoji: '📣', companyId: 'company-001', active: true, monthlyBudget: 5000 },
    { id: 'cat-d5', name: 'Utilities (Luz, Água, Internet)', type: 'despesa', color: '#eab308', emoji: '⚡', companyId: 'company-001', active: true, monthlyBudget: 3000 },
    { id: 'cat-d6', name: 'Impostos e Taxas', type: 'despesa', color: '#6366f1', emoji: '🏛️', companyId: 'company-001', active: true, monthlyBudget: 10000 },
    { id: 'cat-d7', name: 'Manutenção e Reparos', type: 'despesa', color: '#64748b', emoji: '🔩', companyId: 'company-001', active: true, monthlyBudget: 2000 },
    { id: 'cat-d8', name: 'Fretes e Logística', type: 'despesa', color: '#0ea5e9', emoji: '🚚', companyId: 'company-001', active: true, monthlyBudget: 4000 },
  ];

  const bankAccounts: BankAccount[] = [
    { id: 'bank-001', name: 'Conta Corrente Principal', bank: 'Itaú', agency: '0001', account: '12345-6', type: 'corrente', balance: 48750.50, initialBalance: 48750.50, color: '#f97316', companyId: 'company-001' },
    { id: 'bank-002', name: 'Conta Poupança', bank: 'Bradesco', agency: '0023', account: '98765-4', type: 'poupanca', balance: 22100.00, initialBalance: 22100.00, color: '#ef4444', companyId: 'company-001' },
    { id: 'bank-003', name: 'Nubank Conta Digital', bank: 'Nubank', agency: '0001', account: '11111-1', type: 'corrente', balance: 35000.00, initialBalance: 35000.00, color: '#8b5cf6', companyId: 'company-001' },
  ];

  const transactions: Transaction[] = [
    // RECEITAS
    { id: 'tx-001', type: 'receita', description: 'Venda para Mercado São Paulo', amount: 12500.00, dueDate: d(-5), paymentDate: d(-5), status: 'recebido', categoryId: 'cat-r1', categoryName: 'Vendas de Produtos', bankAccountId: 'bank-001', paymentMethod: 'pix', recurrence: 'unico', companyId: 'company-001', createdAt: d(-5) },
    { id: 'tx-002', type: 'receita', description: 'Consultoria Projeto Alpha', amount: 8500.00, dueDate: d(-2), paymentDate: d(-2), status: 'recebido', categoryId: 'cat-r2', categoryName: 'Prestação de Serviços', bankAccountId: 'bank-001', paymentMethod: 'transferencia', recurrence: 'unico', companyId: 'company-001', createdAt: d(-2) },
    { id: 'tx-003', type: 'receita', description: 'Pedido #PV-2025-047', amount: 5200.00, dueDate: d(3), status: 'pendente', categoryId: 'cat-r1', categoryName: 'Vendas de Produtos', bankAccountId: 'bank-001', paymentMethod: 'boleto', recurrence: 'unico', companyId: 'company-001', createdAt: d(-1) },
    { id: 'tx-004', type: 'receita', description: 'Assinatura Mensal Cliente Premium', amount: 3800.00, dueDate: d(7), status: 'pendente', categoryId: 'cat-r2', categoryName: 'Prestação de Serviços', recurrence: 'mensal', recurrenceGroupId: 'grp-001', companyId: 'company-001', createdAt: d(-30) },
    { id: 'tx-005', type: 'receita', description: 'Venda Distribuidora Leste', amount: 18700.00, dueDate: d(-8), status: 'atrasado', categoryId: 'cat-r1', categoryName: 'Vendas de Produtos', bankAccountId: 'bank-001', recurrence: 'unico', companyId: 'company-001', createdAt: d(-10) },
    { id: 'tx-006', type: 'receita', description: 'Rendimento Aplicação Financeira', amount: 820.00, dueDate: d(-15), paymentDate: d(-15), status: 'recebido', categoryId: 'cat-r3', categoryName: 'Juros e Rendimentos', bankAccountId: 'bank-003', recurrence: 'unico', companyId: 'company-001', createdAt: d(-15) },
    { id: 'tx-007', type: 'receita', description: 'Serviço de Instalação', amount: 2200.00, dueDate: d(12), status: 'agendado', categoryId: 'cat-r2', categoryName: 'Prestação de Serviços', recurrence: 'unico', companyId: 'company-001', createdAt: d(0) },
    { id: 'tx-008', type: 'receita', description: 'Venda Atacado Norte', amount: 9400.00, dueDate: d(15), status: 'pendente', categoryId: 'cat-r1', categoryName: 'Vendas de Produtos', paymentMethod: 'boleto', recurrence: 'unico', companyId: 'company-001', createdAt: d(-3) },
    // DESPESAS
    { id: 'tx-009', type: 'despesa', description: 'Folha de Pagamento - Junho', amount: 24800.00, dueDate: d(-1), paymentDate: d(-1), status: 'pago', categoryId: 'cat-d1', categoryName: 'Salários e Encargos', bankAccountId: 'bank-001', paymentMethod: 'transferencia', recurrence: 'mensal', recurrenceGroupId: 'grp-002', companyId: 'company-001', createdAt: d(-1) },
    { id: 'tx-010', type: 'despesa', description: 'Aluguel Galpão Industrial', amount: 7500.00, dueDate: d(5), status: 'pendente', categoryId: 'cat-d2', categoryName: 'Aluguel', bankAccountId: 'bank-001', paymentMethod: 'boleto', recurrence: 'mensal', recurrenceGroupId: 'grp-003', companyId: 'company-001', createdAt: d(-30) },
    { id: 'tx-011', type: 'despesa', description: 'Fornecedor Embalagens S.A.', amount: 4320.00, dueDate: d(-3), status: 'atrasado', categoryId: 'cat-d3', categoryName: 'Fornecedores', paymentMethod: 'boleto', recurrence: 'unico', companyId: 'company-001', createdAt: d(-10) },
    { id: 'tx-012', type: 'despesa', description: 'Energia Elétrica', amount: 2180.00, dueDate: d(-6), paymentDate: d(-6), status: 'pago', categoryId: 'cat-d5', categoryName: 'Utilities', bankAccountId: 'bank-001', paymentMethod: 'boleto', recurrence: 'unico', companyId: 'company-001', createdAt: d(-6) },
    { id: 'tx-013', type: 'despesa', description: 'IRPJ + CSLL - Maio', amount: 8200.00, dueDate: d(-7), status: 'atrasado', categoryId: 'cat-d6', categoryName: 'Impostos e Taxas', paymentMethod: 'dinheiro', recurrence: 'unico', companyId: 'company-001', createdAt: d(-20) },
    { id: 'tx-014', type: 'despesa', description: 'Google Ads - Campanha Junho', amount: 3500.00, dueDate: d(2), status: 'pendente', categoryId: 'cat-d4', categoryName: 'Marketing', bankAccountId: 'bank-001', paymentMethod: 'cartao_credito', recurrence: 'unico', companyId: 'company-001', createdAt: d(-1) },
    { id: 'tx-015', type: 'despesa', description: 'Manutenção Empilhadeira', amount: 1850.00, dueDate: d(-12), paymentDate: d(-12), status: 'pago', categoryId: 'cat-d7', categoryName: 'Manutenção', bankAccountId: 'bank-001', paymentMethod: 'pix', recurrence: 'unico', companyId: 'company-001', createdAt: d(-12) },
    { id: 'tx-016', type: 'despesa', description: 'Internet e Telefonia', amount: 890.00, dueDate: d(8), status: 'agendado', categoryId: 'cat-d5', categoryName: 'Utilities', recurrence: 'mensal', recurrenceGroupId: 'grp-004', companyId: 'company-001', createdAt: d(-30) },
    { id: 'tx-017', type: 'despesa', description: 'Frete - Transportadora Rápido', amount: 2400.00, dueDate: d(-4), paymentDate: d(-4), status: 'pago', categoryId: 'cat-d8', categoryName: 'Fretes', bankAccountId: 'bank-001', paymentMethod: 'pix', recurrence: 'unico', companyId: 'company-001', createdAt: d(-4) },
    { id: 'tx-018', type: 'despesa', description: 'Software ERP Licença Anual', amount: 5400.00, dueDate: d(20), status: 'agendado', categoryId: 'cat-d4', categoryName: 'Marketing', recurrence: 'anual', companyId: 'company-001', createdAt: d(-5) },
  ];

  const customers: Customer[] = [
    { id: 'cust-001', type: 'pessoa_juridica', name: 'Mercado São Paulo Ltda.', document: '11.222.333/0001-44', email: 'compras@mercadosp.com.br', phone: '(11) 3333-4444', address: { street: 'Rua do Comércio', number: '200', neighborhood: 'Centro', city: 'São Paulo', state: 'SP', zipCode: '01000-000' }, creditLimit: 50000, companyId: 'company-001', createdAt: d(-90) },
    { id: 'cust-002', type: 'pessoa_juridica', name: 'Distribuidora Leste S.A.', document: '55.666.777/0001-88', email: 'financeiro@distleste.com', phone: '(11) 9999-8888', address: { street: 'Av. Industrial', number: '500', neighborhood: 'Dist. Industrial', city: 'São Bernardo', state: 'SP', zipCode: '09000-000' }, creditLimit: 80000, companyId: 'company-001', createdAt: d(-120) },
    { id: 'cust-003', type: 'pessoa_fisica', name: 'Carlos Alberto Mendes', document: '123.456.789-00', email: 'carlos@gmail.com', phone: '(11) 97777-6666', address: { street: 'Rua das Flores', number: '45', neighborhood: 'Jardim Europa', city: 'São Paulo', state: 'SP', zipCode: '04000-000' }, companyId: 'company-001', createdAt: d(-60) },
    { id: 'cust-004', type: 'pessoa_juridica', name: 'Atacado Norte ME', document: '99.888.777/0001-66', email: 'compras@atacadonorte.com', phone: '(92) 3333-2222', address: { street: 'Av. do Comércio', number: '1200', neighborhood: 'Centro', city: 'Manaus', state: 'AM', zipCode: '69000-000' }, creditLimit: 60000, companyId: 'company-001', createdAt: d(-45) },
  ];

  const products: Product[] = [
    { id: 'prod-001', name: 'Caixa de Papelão P', code: 'EMB-001', category: 'Embalagens', type: 'produto', unitPrice: 2.50, costPrice: 1.20, unit: 'un', stock: 1500, minStock: 200, active: true, companyId: 'company-001' },
    { id: 'prod-002', name: 'Caixa de Papelão G', code: 'EMB-002', category: 'Embalagens', type: 'produto', unitPrice: 4.80, costPrice: 2.30, unit: 'un', stock: 800, minStock: 100, active: true, companyId: 'company-001' },
    { id: 'prod-003', name: 'Fita Adesiva 45mm', code: 'EMB-003', category: 'Embalagens', type: 'produto', unitPrice: 3.20, costPrice: 1.50, unit: 'rl', stock: 300, minStock: 50, active: true, companyId: 'company-001' },
    { id: 'prod-004', name: 'Consultoria Logística', code: 'SRV-001', category: 'Serviços', type: 'servico', unitPrice: 250.00, costPrice: 0, unit: 'hr', stock: 0, minStock: 0, active: true, companyId: 'company-001' },
  ];

  const salesOrders: SalesOrder[] = [
    { id: 'ord-001', number: 'PV-2025-046', customerId: 'cust-001', customerName: 'Mercado São Paulo Ltda.', status: 'entregue', items: [{ id: 'item-001', productId: 'prod-001', productName: 'Caixa P', quantity: 500, unitPrice: 2.50, discount: 0, total: 1250 }], subtotal: 1250, discount: 0, total: 1250, createdAt: d(-5), updatedAt: d(-5), companyId: 'company-001' },
    { id: 'ord-002', number: 'PV-2025-047', customerId: 'cust-002', customerName: 'Distribuidora Leste S.A.', status: 'confirmado', items: [{ id: 'item-002', productId: 'prod-002', productName: 'Caixa G', quantity: 300, unitPrice: 4.80, discount: 0, total: 1440 }], subtotal: 1440, discount: 0, total: 1440, createdAt: d(-3), updatedAt: d(-3), companyId: 'company-001' },
  ];

  const stockMovements: StockMovement[] = [
    { id: 'mov-001', productId: 'prod-001', productName: 'Caixa de Papelão P', type: 'saida', quantity: 500, previousStock: 2000, newStock: 1500, reason: 'Pedido PV-2025-046', orderId: 'ord-001', createdAt: d(-5), companyId: 'company-001' },
    { id: 'mov-002', productId: 'prod-002', productName: 'Caixa de Papelão G', type: 'saida', quantity: 300, previousStock: 1100, newStock: 800, reason: 'Pedido PV-2025-047', orderId: 'ord-002', createdAt: d(-3), companyId: 'company-001' },
  ];

  const costCenters: CostCenter[] = [
    { id: 'cc-001', name: 'Filial São Paulo', code: 'SP-01', description: 'Operações da filial SP', isActive: true, monthlyBudget: 50000, companyId: 'company-001' },
    { id: 'cc-002', name: 'Departamento TI', code: 'TI-01', description: 'Infraestrutura e sistemas', isActive: true, monthlyBudget: 15000, companyId: 'company-001' },
    { id: 'cc-003', name: 'Comercial', code: 'COM-01', description: 'Vendas e marketing', isActive: true, monthlyBudget: 30000, companyId: 'company-001' },
  ];

  const notifications: Notification[] = [
    { id: 'notif-001', title: '3 lançamentos atrasados', message: 'Você tem 3 transações vencidas que precisam de atenção', type: 'warning', read: false, link: '/financeiro/transacoes', createdAt: new Date().toISOString() },
    { id: 'notif-002', title: 'Extrato importado', message: 'Extrato do Itaú processado com 24 transações', type: 'success', read: false, link: '/financeiro/conciliacao', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'notif-003', title: 'Orçamento estourado', message: 'Categoria "Salários" atingiu 98% do orçamento mensal', type: 'error', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
  ];

  return { company, categories, bankAccounts, transactions, customers, products, salesOrders, stockMovements, costCenters, notifications };
}
