import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createKeyPass, updateKeyPass } from '../api/keypass';
import { ApiError } from '../api/errors';
import { useAuth } from '../state/AuthContext';
import type { CreateKeyPassRequest, KeyPass, UpdateKeyPassRequest } from '../types/keypass';
import { Modal } from './Modal';
import { PasswordInput } from './PasswordInput';

export type EntryFormMode = 'create' | 'edit';

type EntryFormProps = {
  mode: EntryFormMode;
  /** The entry being edited. Its password is never read into the form. */
  entry?: KeyPass;
  onClose: () => void;
  onSaved: (entry: KeyPass, mode: EntryFormMode) => void;
};

type Fields = {
  group: string;
  title: string;
  username: string;
  url: string;
  notes: string;
};

const EMPTY_FIELDS: Fields = { group: '', title: '', username: '', url: '', notes: '' };

export function EntryForm({ mode, entry, onClose, onSaved }: EntryFormProps) {
  const { token } = useAuth();
  const fieldId = useId();
  const [fields, setFields] = useState<Fields>(() =>
    mode === 'edit' && entry
      ? {
          group: entry.group ?? '',
          title: entry.title ?? '',
          username: entry.username ?? '',
          url: entry.url ?? '',
          notes: entry.notes ?? '',
        }
      : EMPTY_FIELDS,
  );
  // Password lives in its own state so it can be wiped independently of the
  // other fields. It is never seeded from the entry.
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  // Wipe sensitive state and cancel any in-flight save when the form unmounts.
  useEffect(() => {
    return () => {
      setPassword('');
      controller.current?.abort();
    };
  }, []);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    if (key === 'title' && value.trim()) setTitleError(null);
  }

  function close() {
    setPassword('');
    onClose();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const title = fields.title.trim();
    if (!title) {
      setTitleError('Title is required.');
      document.getElementById(`${fieldId}-title`)?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;

    try {
      let saved: KeyPass;
      if (mode === 'create') {
        const body: CreateKeyPassRequest = {
          group: fields.group.trim(),
          title,
          username: fields.username.trim(),
          password,
          url: fields.url.trim(),
          notes: fields.notes,
        };
        saved = await createKeyPass(body, { token, signal: abort.signal });
      } else {
        const body: UpdateKeyPassRequest = {
          group: fields.group.trim(),
          title,
          username: fields.username.trim(),
          url: fields.url.trim(),
          notes: fields.notes,
        };
        // Only send `password` when a new one was typed - an omitted field keeps
        // the existing password on the backend.
        if (password) body.password = password;
        saved = await updateKeyPass(entry!.id, body, { token, signal: abort.signal });
      }

      setPassword('');
      onSaved(saved, mode);
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'canceled') return;
      setFormError(
        error instanceof ApiError ? error.message : 'The entry could not be saved. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isEdit = mode === 'edit';

  return (
    <Modal
      title={isEdit ? 'Edit entry' : 'Add entry'}
      description={
        isEdit
          ? 'Leave the password blank to keep the existing one. The current password is never loaded into this form.'
          : 'Title is required. Every other field may be left empty.'
      }
      onClose={close}
    >
      <form className="entry-form" onSubmit={onSubmit} noValidate>
        {formError ? (
          <p className="form-error" role="alert">
            <strong>Error:</strong> {formError}
          </p>
        ) : null}

        <div className="field">
          <label htmlFor={`${fieldId}-title`}>
            Title <span className="required">(required)</span>
          </label>
          <input
            id={`${fieldId}-title`}
            name="title"
            type="text"
            value={fields.title}
            onChange={(event) => update('title', event.target.value)}
            required
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? `${fieldId}-title-error` : undefined}
            autoComplete="off"
          />
          {titleError ? (
            <p className="field-error" id={`${fieldId}-title-error`} role="alert">
              {titleError}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor={`${fieldId}-group`}>Group</label>
          <input
            id={`${fieldId}-group`}
            name="group"
            type="text"
            value={fields.group}
            onChange={(event) => update('group', event.target.value)}
            placeholder="Root/Work"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor={`${fieldId}-username`}>Username</label>
          <input
            id={`${fieldId}-username`}
            name="username"
            type="text"
            value={fields.username}
            onChange={(event) => update('username', event.target.value)}
            autoComplete="off"
          />
        </div>

        <PasswordInput
          id={`${fieldId}-password`}
          label={isEdit ? 'New password (optional)' : 'Password'}
          value={password}
          onChange={setPassword}
          hint={
            isEdit
              ? 'Leave blank to preserve the existing password. Existing passwords cannot be loaded here.'
              : 'Generated passwords are created locally in your browser.'
          }
          hintId={`${fieldId}-password-hint`}
          disabled={submitting}
        />

        <div className="field">
          <label htmlFor={`${fieldId}-url`}>URL</label>
          <input
            id={`${fieldId}-url`}
            name="url"
            type="url"
            inputMode="url"
            value={fields.url}
            onChange={(event) => update('url', event.target.value)}
            placeholder="https://example.com"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor={`${fieldId}-notes`}>Notes</label>
          <textarea
            id={`${fieldId}-notes`}
            name="notes"
            rows={3}
            value={fields.notes}
            onChange={(event) => update('notes', event.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="button secondary" onClick={close} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="button primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
