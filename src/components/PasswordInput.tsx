import { useState } from 'react';
import { generatePassword } from '../utils/password';
import { EyeIcon, EyeOffIcon, RefreshIcon } from './Icons';

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  hintId?: string;
  withGenerator?: boolean;
  disabled?: boolean;
};

/** A labelled password field with local show/hide and an in-browser generator. */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  hint,
  hintId,
  withGenerator = true,
  disabled = false,
}: PasswordInputProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          name={id}
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="new-password"
          spellCheck={false}
          aria-describedby={hint && hintId ? hintId : undefined}
          disabled={disabled}
        />
        <button
          type="button"
          className="icon-button"
          onClick={() => setRevealed((current) => !current)}
          aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={revealed}
          disabled={disabled}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        {withGenerator ? (
          <button
            type="button"
            className="icon-button"
            onClick={() => {
              onChange(generatePassword());
              setRevealed(true);
            }}
            aria-label="Generate a password in this browser"
            title="Generate password"
            disabled={disabled}
          >
            <RefreshIcon />
          </button>
        ) : null}
      </div>
      {hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
