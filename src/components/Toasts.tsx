import { useToast } from '../state/ToastContext';
import { CloseIcon } from './Icons';

const TONE_LABEL = {
  success: 'Success',
  error: 'Error',
  info: 'Notice',
} as const;

/**
 * Notifications are announced politely and labelled with a text prefix, so the
 * status is never conveyed by color alone.
 */
export function Toasts() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="toast-stack" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.tone}`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
        >
          <span className="toast-label">{TONE_LABEL[toast.tone]}:</span>
          <span className="toast-message">{toast.message}</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}
