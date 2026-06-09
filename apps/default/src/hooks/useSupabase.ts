// ============================================================
// SUPABASE REACT HOOKS
// Generic hooks for querying / mutating Supabase tables
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { sbSelect, sbInsert, sbUpdate, sbDelete, sbUpsert } from '../lib/supabase';

// ── Types ────────────────────────────────────────────────────

export interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface MutationState<T> {
  loading: boolean;
  error: string | null;
  insert: (row: Partial<T>) => Promise<T | null>;
  update: (id: string, patch: Partial<T>) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  upsert: (row: Partial<T>) => Promise<T | null>;
}

// ── useSupabaseQuery ─────────────────────────────────────────

/**
 * Fetches rows from a Supabase table.
 * Automatically re-fetches on mount and when params change.
 */
export function useSupabaseQuery<T>(
  table: string,
  params?: Record<string, string>,
  enabled = true
): QueryState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await sbSelect<T>(table, paramsRef.current);
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar dados';
      setError(msg);
      console.error(`[Supabase] Error fetching ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ── useSupabaseMutation ──────────────────────────────────────

/**
 * Provides insert / update / delete / upsert operations for a table.
 */
export function useSupabaseMutation<T>(table: string): MutationState<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (row: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await sbInsert<T>(table, row);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao inserir';
      setError(msg);
      console.error(`[Supabase] Error inserting into ${table}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const update = useCallback(async (id: string, patch: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await sbUpdate<T>(table, id, patch);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar';
      setError(msg);
      console.error(`[Supabase] Error updating ${table}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await sbDelete(table, id);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao deletar';
      setError(msg);
      console.error(`[Supabase] Error deleting from ${table}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const upsert = useCallback(async (row: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await sbUpsert<T>(table, row);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(msg);
      console.error(`[Supabase] Error upserting into ${table}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [table]);

  return { loading, error, insert, update, remove, upsert };
}

// ── Typed domain hooks ───────────────────────────────────────

export function useTransactions(companyId?: string) {
  const params = companyId ? { company_id: `eq.${companyId}`, order: 'created_at.desc' } : { order: 'created_at.desc' };
  return useSupabaseQuery<Record<string, unknown>>('transactions', params);
}

export function useCustomers(companyId?: string) {
  const params = companyId ? { company_id: `eq.${companyId}`, order: 'name.asc' } : { order: 'name.asc' };
  return useSupabaseQuery<Record<string, unknown>>('customers', params);
}

export function useProducts(companyId?: string) {
  const params = companyId ? { company_id: `eq.${companyId}`, order: 'name.asc' } : { order: 'name.asc' };
  return useSupabaseQuery<Record<string, unknown>>('products', params);
}

export function useSalesOrders(companyId?: string) {
  const params = companyId ? { company_id: `eq.${companyId}`, order: 'created_at.desc' } : { order: 'created_at.desc' };
  return useSupabaseQuery<Record<string, unknown>>('sales_orders', params);
}

export function useBankAccounts(companyId?: string) {
  const params = companyId ? { company_id: `eq.${companyId}` } : {};
  return useSupabaseQuery<Record<string, unknown>>('bank_accounts', params);
}

export function useChartOfAccounts(companyId?: string) {
  const params = companyId ? { company_id: `eq.${companyId}`, order: 'code.asc' } : { order: 'code.asc' };
  return useSupabaseQuery<Record<string, unknown>>('chart_of_accounts', params);
}

export function useStockMovements(companyId?: string) {
  const params = companyId ? { company_id: `eq.${companyId}`, order: 'created_at.desc' } : { order: 'created_at.desc' };
  return useSupabaseQuery<Record<string, unknown>>('stock_movements', params);
}
