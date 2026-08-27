import { ApiError, defaultMessageForStatus, kindForStatus } from './errors';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Base URL for the KeyPass API, without a trailing slash. */
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Serialized as a JSON request body. */
  body?: unknown;
  /** Appended as a query string; null/undefined values are dropped. */
  query?: Record<string, string | number | undefined | null>;
  token: string | null;
  signal?: AbortSignal;
};

export function isLocalHost(hostname = window.location.hostname): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function buildUrl(path: string, query: RequestOptions['query']): string {
  if (!API_BASE_URL) {
    throw new ApiError(
      'unknown',
      'No API base URL is configured. Set VITE_API_BASE_URL and restart the dev server.',
    );
  }
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * Reads a response body as JSON when there is one. Returns undefined for 204 and
 * for bodies that are not valid JSON, so a malformed body never throws raw.
 */
async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/** Pulls the backend's `{ "error": "..." }` message when present. */
function backendErrorMessage(payload: unknown): string | null {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const message = (payload as { error?: unknown }).error;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  return null;
}

/**
 * The single API client used by the whole app: builds the URL, attaches the
 * bearer token, serializes/parses JSON, and normalizes every failure - including
 * network errors and cancellation - into an ApiError with a user-safe message.
 */
export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = 'GET', body, query, token, signal } = options;

  if (!token) {
    throw new ApiError('unauthorized', 'Add a bearer token in Settings to use the KeyPass API.');
  }

  const url = buildUrl(path, query);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new ApiError('canceled', 'The request was canceled.');
    }
    throw new ApiError(
      'network',
      `Could not reach the KeyPass API at ${API_BASE_URL}. Check that the backend is running and reachable.`,
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const status = response.status;
    throw new ApiError(
      kindForStatus(status),
      backendErrorMessage(payload) ?? defaultMessageForStatus(status),
      status,
    );
  }

  return payload as T;
}
