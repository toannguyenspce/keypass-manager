import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { API_BASE_URL } from './api/client';
import { TOP_OPTIONS, type TopOption } from './api/keypass';
import { DeleteDialog } from './components/DeleteDialog';
import { EntryForm, type EntryFormMode } from './components/EntryForm';
import { PlusIcon, SearchIcon, SettingsIcon } from './components/Icons';
import { ResultsView } from './components/ResultsView';
import { SettingsPanel } from './components/SettingsPanel';
import { Toasts } from './components/Toasts';
import { useAuth } from './state/AuthContext';
import { useToast } from './state/ToastContext';
import { useKeyPassSearch } from './state/useKeyPassSearch';
import type { KeyPass } from './types/keypass';

type Dialog =
  | { kind: 'none' }
  | { kind: 'settings' }
  | { kind: 'create' }
  | { kind: 'edit'; entry: KeyPass }
  | { kind: 'delete'; entry: KeyPass };

export default function App() {
  const controlId = useId();
  const { token, hasToken } = useAuth();
  const { notify } = useToast();
  const { state, runSearch, reset, removeItem, replaceItem } = useKeyPassSearch(token);

  const [query, setQuery] = useState('');
  const [top, setTop] = useState<TopOption>(5);
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });
  // Reveal state is keyed by entry id and lives only here, never in storage.
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(() => new Set());
  const lastSearch = useRef<{ query: string; top: TopOption } | null>(null);

  const clearRevealed = useCallback(() => setRevealedIds(new Set()), []);

  // Signing out discards results and any revealed password.
  useEffect(() => {
    if (!hasToken) {
      reset();
      clearRevealed();
      lastSearch.current = null;
    }
  }, [hasToken, reset, clearRevealed]);

  const search = useCallback(
    (nextQuery: string, nextTop: TopOption) => {
      // Every refresh re-masks all passwords.
      clearRevealed();
      lastSearch.current = { query: nextQuery, top: nextTop };
      void runSearch(nextQuery, nextTop);
    },
    [clearRevealed, runSearch],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasToken) {
      setDialog({ kind: 'settings' });
      return;
    }
    search(query, top);
  }

  function onToggleReveal(id: string, next: boolean) {
    setRevealedIds((current) => {
      const updated = new Set(current);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  }

  function refreshAfterMutation() {
    const previous = lastSearch.current;
    if (previous?.query) search(previous.query, previous.top);
  }

  function onSaved(entry: KeyPass, mode: EntryFormMode) {
    setDialog({ kind: 'none' });
    if (mode === 'create') {
      notify('success', `“${entry.title}” was added.`);
      refreshAfterMutation();
    } else {
      notify('success', `“${entry.title}” was updated.`);
      // Re-mask the edited row: its password may have changed.
      onToggleReveal(entry.id, false);
      replaceItem(entry);
    }
  }

  function onDeleted(entry: KeyPass) {
    setDialog({ kind: 'none' });
    onToggleReveal(entry.id, false);
    removeItem(entry.id);
    notify('success', `“${entry.title}” was deleted.`);
  }

  const showResults = state.items.length > 0;
  const isLoading = state.status === 'loading';

  return (
    <div className="app">
      <header className="app-header">
        <h1>KeyPass Manager</h1>
        <div className="header-actions">
          <span className={`auth-pill ${hasToken ? 'ok' : 'warn'}`}>
            {hasToken ? 'Token set' : 'No token'}
          </span>
          <button
            type="button"
            className="button secondary"
            onClick={() => setDialog({ kind: 'create' })}
            disabled={!hasToken}
          >
            <PlusIcon />
            <span>Add entry</span>
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => setDialog({ kind: 'settings' })}
          >
            <SettingsIcon />
            <span>Settings</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <form className="search-bar" onSubmit={onSubmit} role="search">
          <div className="search-field">
            <label htmlFor={`${controlId}-query`}>Search</label>
            <input
              id={`${controlId}-query`}
              name="query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search entries by meaning, e.g. github"
              autoComplete="off"
            />
          </div>
          <div className="search-top">
            <label htmlFor={`${controlId}-top`}>Results</label>
            <select
              id={`${controlId}-top`}
              name="top"
              value={top}
              onChange={(event) => setTop(Number(event.target.value) as TopOption)}
            >
              {TOP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="button primary" disabled={isLoading}>
            <SearchIcon />
            <span>{isLoading ? 'Searching…' : 'Search'}</span>
          </button>
        </form>

        <section className="results" aria-live="polite" aria-busy={isLoading}>
          {!hasToken ? (
            <div className="state-panel">
              <h2>Authentication required</h2>
              <p>
                All KeyPass endpoints need a bearer token. Open Settings and paste a token to start
                searching.
              </p>
              <p className="state-meta">
                API base URL: <code>{API_BASE_URL || 'not configured'}</code>
              </p>
              <button
                type="button"
                className="button primary"
                onClick={() => setDialog({ kind: 'settings' })}
              >
                Open Settings
              </button>
            </div>
          ) : isLoading && !showResults ? (
            <div className="state-panel">
              <h2>Searching…</h2>
              <p>Looking for entries that match your query.</p>
            </div>
          ) : state.status === 'error' && state.error ? (
            <div className="state-panel error" role="alert">
              <h2>
                {state.error.kind === 'network'
                  ? 'Network error'
                  : state.error.isAuthProblem
                    ? 'Authentication required'
                    : 'Search failed'}
              </h2>
              <p>{state.error.message}</p>
              <div className="state-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => search(query, top)}
                >
                  Try again
                </button>
                {state.error.isAuthProblem ? (
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => setDialog({ kind: 'settings' })}
                  >
                    Open Settings
                  </button>
                ) : null}
              </div>
              {showResults ? (
                <p className="state-meta">The results below are from your last successful search.</p>
              ) : null}
            </div>
          ) : null}

          {showResults ? (
            <>
              <p className="results-summary">
                {state.items.length} {state.items.length === 1 ? 'entry' : 'entries'} for “
                {state.lastQuery}”. Passwords stay masked until you reveal them individually.
              </p>
              <ResultsView
                items={state.items}
                revealedIds={revealedIds}
                onToggleReveal={onToggleReveal}
                onEdit={(entry) => setDialog({ kind: 'edit', entry })}
                onDelete={(entry) => setDialog({ kind: 'delete', entry })}
              />
            </>
          ) : hasToken && state.status === 'loaded' ? (
            <div className="state-panel">
              <h2>{state.lastQuery ? 'No results' : 'Enter a search term'}</h2>
              <p>
                {state.lastQuery
                  ? `No entries matched “${state.lastQuery}”. Try different wording — search uses semantic similarity.`
                  : 'An empty query returns no results. Type something to search your vault.'}
              </p>
            </div>
          ) : hasToken && state.status === 'idle' ? (
            <div className="state-panel">
              <h2>Search your vault</h2>
              <p>
                Enter a term and choose how many results to return (5, 10 or 20). Matching is
                semantic, so descriptive terms work well.
              </p>
            </div>
          ) : null}
        </section>
      </main>

      {dialog.kind === 'settings' ? (
        <SettingsPanel onClose={() => setDialog({ kind: 'none' })} />
      ) : null}
      {dialog.kind === 'create' ? (
        <EntryForm mode="create" onClose={() => setDialog({ kind: 'none' })} onSaved={onSaved} />
      ) : null}
      {dialog.kind === 'edit' ? (
        <EntryForm
          mode="edit"
          entry={dialog.entry}
          onClose={() => setDialog({ kind: 'none' })}
          onSaved={onSaved}
        />
      ) : null}
      {dialog.kind === 'delete' ? (
        <DeleteDialog
          entry={dialog.entry}
          onClose={() => setDialog({ kind: 'none' })}
          onDeleted={onDeleted}
        />
      ) : null}

      <Toasts />
    </div>
  );
}
