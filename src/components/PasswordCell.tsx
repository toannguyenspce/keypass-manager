import { useId, useState } from 'react';
import { hasUsablePassword, type KeyPass } from '../types/keypass';
import { copyToClipboard } from '../utils/password';
import { useToast } from '../state/ToastContext';
import { CopyIcon, EyeIcon, EyeOffIcon } from './Icons';

type PasswordCellProps = {
  entry: KeyPass;
  /** Reveal state is owned by the parent so it can be cleared for every row. */
  revealed: boolean;
  onToggle: (id: string, next: boolean) => void;
};

const MASK = '******';

/**
 * Shows one entry's password. Masked by default, revealed only by an explicit
 * click on this row, and copyable only once revealed.
 */
export function PasswordCell({ entry, revealed, onToggle }: PasswordCellProps) {
  const inputId = useId();
  const { notify } = useToast();
  const [copying, setCopying] = useState(false);
  const available = hasUsablePassword(entry);

  if (!available) {
    return (
      <span className="password-unavailable">
        Not available
        <span className="sr-only"> for {entry.title}</span>
      </span>
    );
  }

  async function copy() {
    if (!revealed || copying) return;
    setCopying(true);
    const ok = await copyToClipboard(entry.password);
    setCopying(false);
    notify(
      ok ? 'success' : 'error',
      ok
        ? `Password for ${entry.title} copied to the clipboard.`
        : `The clipboard is unavailable, so the password for ${entry.title} was not copied.`,
    );
  }

  return (
    <div className="password-cell">
      <label className="sr-only" htmlFor={inputId}>
        Password for {entry.title}
      </label>
      <input
        id={inputId}
        className="password-value"
        type={revealed ? 'text' : 'password'}
        value={revealed ? entry.password : MASK}
        readOnly
        tabIndex={-1}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        className="icon-button"
        onClick={() => onToggle(entry.id, !revealed)}
        aria-label={revealed ? `Hide password for ${entry.title}` : `Show password for ${entry.title}`}
        aria-pressed={revealed}
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </button>
      <button
        type="button"
        className="icon-button"
        onClick={copy}
        disabled={!revealed || copying}
        aria-label={`Copy password for ${entry.title}`}
        title={revealed ? 'Copy password' : 'Reveal the password before copying'}
      >
        <CopyIcon />
      </button>
    </div>
  );
}
