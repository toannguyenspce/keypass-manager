export type ApiErrorKind =
  | 'network'
  | 'canceled'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'conflict'
  | 'server'
  | 'unknown';

/**
 * Every failure surfaced by the API client is an ApiError with a message that is
 * safe to show to a user. Raw stack traces and response bodies never reach the UI.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }

  get isAuthProblem(): boolean {
    return this.kind === 'unauthorized' || this.kind === 'forbidden';
  }
}

export function isCanceled(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'canceled';
}

export function kindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'validation';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 409:
      return 'conflict';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

export function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'The request was rejected as invalid. Please check the fields and try again.';
    case 401:
      return 'Authentication failed. Add or update your bearer token in Settings.';
    case 403:
      return 'Your token does not have permission to perform this action.';
    case 404:
      return 'That entry no longer exists. Run the search again to refresh the list.';
    case 409:
      return 'The request conflicts with the current state of the entry.';
    default:
      if (status >= 500) return 'The KeyPass API returned a server error. Please try again shortly.';
      return `The request failed with HTTP ${status}.`;
  }
}
