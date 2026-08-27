export type KeyPass = {
  id: string;
  group: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  createdAt: string;
  updatedAt: string | null;
};

export type CreateKeyPassRequest = {
  group: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
};

export type UpdateKeyPassRequest = {
  group?: string;
  title?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
};

export type SearchResponse = {
  items: KeyPass[];
};

/**
 * Placeholder the backend returns when a password cannot be decrypted.
 * It is never a real password and must never be shown as one.
 */
export const UNAVAILABLE_PASSWORD = '[unavailable]';

export function hasUsablePassword(entry: Pick<KeyPass, 'password'>): boolean {
  return Boolean(entry.password) && entry.password !== UNAVAILABLE_PASSWORD;
}
