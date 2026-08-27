import { useCallback, useEffect, useRef, useState } from 'react';
import { searchKeyPass, type TopOption } from '../api/keypass';
import { ApiError, isCanceled } from '../api/errors';
import type { KeyPass } from '../types/keypass';

export type SearchStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type SearchState = {
  status: SearchStatus;
  items: KeyPass[];
  error: ApiError | null;
  /** The query that produced the current results, for the empty-state message. */
  lastQuery: string;
};

const INITIAL: SearchState = { status: 'idle', items: [], error: null, lastQuery: '' };

export function useKeyPassSearch(token: string | null) {
  const [state, setState] = useState<SearchState>(INITIAL);
  const inFlight = useRef<AbortController | null>(null);

  const cancelInFlight = useCallback(() => {
    inFlight.current?.abort();
    inFlight.current = null;
  }, []);

  // Abort any pending request when the component using the hook unmounts.
  useEffect(() => cancelInFlight, [cancelInFlight]);

  const reset = useCallback(() => {
    cancelInFlight();
    setState(INITIAL);
  }, [cancelInFlight]);

  const runSearch = useCallback(
    async (query: string, top: TopOption) => {
      const trimmed = query.trim();
      cancelInFlight();

      if (!trimmed) {
        // An empty query returns no results, so don't spend a request on it.
        setState({ status: 'loaded', items: [], error: null, lastQuery: '' });
        return;
      }

      const controller = new AbortController();
      inFlight.current = controller;
      setState((current) => ({ ...current, status: 'loading', error: null }));

      try {
        const items = await searchKeyPass(trimmed, top, { token, signal: controller.signal });
        if (controller.signal.aborted) return;
        setState({ status: 'loaded', items, error: null, lastQuery: trimmed });
      } catch (error) {
        if (isCanceled(error) || controller.signal.aborted) return;
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError('unknown', 'Something went wrong while searching.');
        // Keep the previous results so a failed refresh doesn't clear the list.
        setState((current) => ({ ...current, status: 'error', error: apiError }));
      } finally {
        if (inFlight.current === controller) inFlight.current = null;
      }
    },
    [cancelInFlight, token],
  );

  /** Drops an entry from the current results after a successful delete. */
  const removeItem = useCallback((id: string) => {
    setState((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
  }, []);

  /**
   * Replaces an entry in place after a successful update. The PATCH response
   * carries a redacted password, so the row stops offering a reveal until the
   * next search - showing the pre-edit password there would be stale.
   */
  const replaceItem = useCallback((updated: KeyPass) => {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === updated.id ? updated : item)),
    }));
  }, []);

  return { state, runSearch, reset, removeItem, replaceItem };
}
