import type {
  CreateKeyPassRequest,
  KeyPass,
  SearchResponse,
  UpdateKeyPassRequest,
} from '../types/keypass';
import { apiRequest } from './client';

export const TOP_OPTIONS = [5, 10, 20] as const;
export type TopOption = (typeof TOP_OPTIONS)[number];

export type CallOptions = {
  token: string | null;
  signal?: AbortSignal;
};

/** GET /api/keypass/search?query={query}&top={top} - semantic similarity search. */
export async function searchKeyPass(
  query: string,
  top: TopOption,
  { token, signal }: CallOptions,
): Promise<KeyPass[]> {
  const response = await apiRequest<SearchResponse>('/api/keypass/search', {
    method: 'GET',
    query: { query, top },
    token,
    signal,
  });
  return response?.items ?? [];
}

/** POST /api/keypass - returns the created entry (password redacted by the API). */
export function createKeyPass(
  body: CreateKeyPassRequest,
  { token, signal }: CallOptions,
): Promise<KeyPass> {
  return apiRequest<KeyPass>('/api/keypass', { method: 'POST', body, token, signal });
}

/**
 * PATCH /api/keypass/{id}. Only the fields present in `body` are changed; omit
 * `password` entirely to preserve the existing one.
 */
export function updateKeyPass(
  id: string,
  body: UpdateKeyPassRequest,
  { token, signal }: CallOptions,
): Promise<KeyPass> {
  return apiRequest<KeyPass>(`/api/keypass/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
    token,
    signal,
  });
}

/** DELETE /api/keypass/{id} - resolves on HTTP 204. */
export async function deleteKeyPass(id: string, { token, signal }: CallOptions): Promise<void> {
  await apiRequest<void>(`/api/keypass/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
    signal,
  });
}
