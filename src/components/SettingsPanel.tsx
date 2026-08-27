import { useId, useState, type FormEvent } from 'react';
import { API_BASE_URL, isLocalHost } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { useToast } from '../state/ToastContext';
import { Modal } from './Modal';
import { EyeIcon, EyeOffIcon } from './Icons';

type SettingsPanelProps = { onClose: () => void };

/**
 * Where the user pastes a bearer token. The token is held in memory only and is
 * never written to storage or logged.
 */
export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const fieldId = useId();
  const { hasToken, setToken, clearToken } = useAuth();
  const { notify } = useToast();
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);

  const insecureBaseUrl =
    API_BASE_URL.startsWith('http://') && !isLocalHost() && !API_BASE_URL.includes('localhost');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    setToken(value);
    setValue('');
    setRevealed(false);
    notify('success', 'Bearer token saved for this browser tab.');
    onClose();
  }

  function signOut() {
    clearToken();
    setValue('');
    setRevealed(false);
    notify('info', 'Token cleared. Revealed passwords and results were discarded.');
    onClose();
  }

  return (
    <Modal
      title="Settings"
      description="Paste a bearer token issued by your KeyPass backend. It is kept in memory for this tab only and is cleared when you close or reload the page."
      onClose={onClose}
    >
      <form className="entry-form" onSubmit={onSubmit}>
        <div className="field">
          <span className="field-label">API base URL</span>
          <p className="readonly-value">{API_BASE_URL || 'Not configured'}</p>
          <p className="field-hint">
            Configured at build time through <code>VITE_API_BASE_URL</code>.
          </p>
        </div>

        {insecureBaseUrl ? (
          <p className="form-warning" role="alert">
            <strong>Warning:</strong> this page is not running locally but the API base URL uses
            plain HTTP. Use an <code>https://</code> base URL so the token is not sent in the clear.
          </p>
        ) : null}

        <div className="field">
          <label htmlFor={`${fieldId}-token`}>Bearer token</label>
          <div className="password-input">
            <input
              id={`${fieldId}-token`}
              name="bearer-token"
              type={revealed ? 'text' : 'password'}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={hasToken ? 'Replace the current token…' : 'Paste your bearer token'}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={`${fieldId}-token-hint`}
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => setRevealed((current) => !current)}
              aria-label={revealed ? 'Hide bearer token' : 'Show bearer token'}
              aria-pressed={revealed}
            >
              {revealed ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <p className="field-hint" id={`${fieldId}-token-hint`}>
            Status: {hasToken ? 'a token is set for this tab' : 'no token set'}. Client secrets are
            never entered here - obtain a token from your backend and paste it.
          </p>
        </div>

        <div className="form-actions">
          {hasToken ? (
            <button type="button" className="button secondary" onClick={signOut}>
              Sign out
            </button>
          ) : (
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
          )}
          <button type="submit" className="button primary" disabled={!value.trim()}>
            Save token
          </button>
        </div>
      </form>
    </Modal>
  );
}
