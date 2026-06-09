// ============================================================
// SUPABASE REST + AUTH CLIENT
// ============================================================
import axios from 'axios';

const SUPABASE_URL = 'https://jcqpuqhdfveleusjsxeo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Kb5B22FeTpHR90AqZ3q3Fw_upK4MKiZ';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

export const supabaseApi = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
});

export const supabaseAuthApi = axios.create({
  baseURL: `${SUPABASE_URL}/auth/v1`,
  headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
});

export function setSupabaseToken(token: string | null) {
  const bearer = token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`;
  supabaseApi.defaults.headers.Authorization = bearer;
}

// ── Generic CRUD ─────────────────────────────────────────────

export async function sbSelect<T>(table: string, params?: Record<string, string>): Promise<T[]> {
  const { data } = await supabaseApi.get<T[]>(`/${table}`, { params });
  return data ?? [];
}

export async function sbInsert<T>(table: string, row: Partial<T>): Promise<T> {
  const { data } = await supabaseApi.post<T[]>(`/${table}`, row);
  return data[0];
}

export async function sbUpdate<T>(table: string, id: string, patch: Partial<T>): Promise<T> {
  const { data } = await supabaseApi.patch<T[]>(`/${table}`, patch, { params: { id: `eq.${id}` } });
  return data[0];
}

export async function sbDelete(table: string, id: string): Promise<void> {
  await supabaseApi.delete(`/${table}`, { params: { id: `eq.${id}` } });
}

export async function sbUpsert<T>(table: string, row: Partial<T>): Promise<T> {
  const { data } = await supabaseApi.post<T[]>(`/${table}`, row, {
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' },
  });
  return data[0];
}

// ── camelCase ↔ snake_case ────────────────────────────────────

export function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = obj[key];
    }
  }
  return result;
}

export function toCamel<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    result[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = obj[key];
  }
  return result as T;
}

export function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map(r => toCamel<T>(r));
}
