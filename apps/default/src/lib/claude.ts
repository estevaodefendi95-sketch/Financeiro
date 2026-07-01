// ============================================================
// CLAUDE AI SERVICE — via Taskade Proxy
// ============================================================
import { GenesisClient } from '@taskade/genesis-client';

const SPACE_ID = '3gyi7jd06mqtza8q';
const genesis = new GenesisClient({ spaceId: SPACE_ID });

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await genesis.proxy({
    secretAlias: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    method: 'POST',
    headers: {
      'x-api-key': '{{secret}}',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    },
  });
  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON in response');
  return JSON.parse(match[0]);
}

// ── Category suggestion ──────────────────────────────────────

export interface CategorySuggestion {
  categoryId: string;
  name: string;
  confidence: number;
  reason: string;
}

export async function suggestCategory(
  description: string,
  amount: number,
  type: string,
  categories: { id: string; name: string; type: string }[]
): Promise<CategorySuggestion | null> {
  try {
    const text = await callClaude(
      'Você é um assistente financeiro especializado em PMEs brasileiras. Categorize a transação e retorne APENAS JSON válido.',
      `Categorize esta transação brasileira:
Descrição: "${description}"
Valor: R$ ${amount.toFixed(2)}
Tipo: ${type}
Categorias disponíveis: ${JSON.stringify(categories)}
Retorne APENAS: {"categoryId": "id_da_categoria", "name": "nome", "confidence": 0.0-1.0, "reason": "motivo em português"}`
    );
    return extractJSON(text) as CategorySuggestion;
  } catch {
    return null;
  }
}

// ── Name rule learning ───────────────────────────────────────

export interface NameRule {
  pattern: string;
  suggestedName: string;
  confidence: number;
}

export async function learnNameRule(originalName: string, newName: string): Promise<NameRule | null> {
  try {
    const text = await callClaude(
      'Você é um sistema de aprendizado de nomes de transações bancárias. Retorne APENAS JSON.',
      `O usuário renomeou a transação bancária:
De: "${originalName}"
Para: "${newName}"
Crie uma regra reutilizável. Retorne APENAS: {"pattern": "padrão regex ou substring", "suggestedName": "${newName}", "confidence": 0.0-1.0}`
    );
    return extractJSON(text) as NameRule;
  } catch {
    return null;
  }
}

// ── PDF bank statement parse ─────────────────────────────────

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'credito' | 'debito';
  originalId?: string;
}

export async function parseBankStatementPDF(content: string): Promise<ParsedTransaction[]> {
  const text = await callClaude(
    'Você é um parser de extratos bancários brasileiros. Extraia todas as transações e retorne APENAS um JSON array.',
    `Extraia todas as transações deste extrato bancário:
${content.slice(0, 8000)}
Retorne APENAS um array JSON: [{"date": "YYYY-MM-DD", "description": "desc", "amount": 0.00, "type": "credito|debito", "originalId": "id_opcional"}]`
  );
  return extractJSON(text) as ParsedTransaction[];
}

// ── Credit card invoice PDF parse ────────────────────────────

export interface ParsedInvoiceItem {
  purchaseDate: string;
  description: string;
  amount: number;
  installmentNumber?: number;
  totalInstallments?: number;
}

export async function parseCreditCardInvoicePDF(content: string, cardName: string): Promise<ParsedInvoiceItem[]> {
  const text = await callClaude(
    'Você é um parser de faturas de cartão de crédito brasileiras. Extraia todas as compras e retorne APENAS um JSON array.',
    `Extraia todas as compras desta fatura do cartão ${cardName}:
${content.slice(0, 8000)}
Retorne APENAS um array JSON: [{"purchaseDate": "YYYY-MM-DD", "description": "desc", "amount": 0.00, "installmentNumber": null, "totalInstallments": null}]`
  );
  return extractJSON(text) as ParsedInvoiceItem[];
}

// ── Cash flow AI narrative ───────────────────────────────────

export async function getCashFlowNarrative(cashFlowData: unknown): Promise<string> {
  try {
    const text = await callClaude(
      'Você é um consultor financeiro para PMEs brasileiras. Seja conciso e prático.',
      `Com base nesses dados de fluxo de caixa para os próximos 90 dias: ${JSON.stringify(cashFlowData)}
Escreva exatamente 3 frases em português sobre: 1) saúde financeira atual, 2) riscos identificados, 3) uma recomendação acionável. Seja direto e use valores em R$.`
    );
    return text;
  } catch {
    return 'Análise de IA indisponível no momento. Configure sua chave Anthropic em Configurações → Secrets para ativar este recurso.';
  }
}
