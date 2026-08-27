import { useEffect, useRef, useState } from 'react';
import { deleteKeyPass } from '../api/keypass';
import { ApiError } from '../api/errors';
import { useAuth } from '../state/AuthContext';
import type { KeyPass } from '../types/keypass';
import { orDash } from '../utils/format';
import { Modal } from './Modal';

type DeleteDialogProps = {
  entry: KeyPass;
  onClose: () => void;
  onDeleted: (entry: KeyPass) => void;
};

/** Confirms a delete. Shows title, group and username - never the password. */
export function DeleteDialog({ entry, onClose, onDeleted }: DeleteDialogProps) {
  const { token } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function confirm() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    const abort = new AbortController();
    controller.current = abort;

    try {
      await deleteKeyPass(entry.id, { token, signal: abort.signal });
      onDeleted(entry);
    } catch (caught) {
      if (caught instanceof ApiError && caught.kind === 'canceled') return;
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'The entry could not be deleted. Please try again.',
      );
      setDeleting(false);
    }
  }

  return (
    <Modal
      title="Delete entry"
      description="This permanently removes the entry from your KeyPass database."
      onClose={deleting ? () => undefined : onClose}
    >
      {error ? (
        <p className="form-error" role="alert">
          <strong>Error:</strong> {error}
        </p>
      ) : null}

      <dl className="confirm-fields">
        <dt>Title</dt>
        <dd>{orDash(entry.title)}</dd>
        <dt>Group</dt>
        <dd>{orDash(entry.group)}</dd>
        <dt>Username</dt>
        <dd>{orDash(entry.username)}</dd>
      </dl>

      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onClose} disabled={deleting}>
          Cancel
        </button>
        <button type="button" className="button danger-solid" onClick={confirm} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete entry'}
        </button>
      </div>
    </Modal>
  );
}
