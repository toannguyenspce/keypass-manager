const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?';
const ALPHABET = LOWER + UPPER + DIGITS + SYMBOLS;

/** Uniform index in [0, max) drawn from the platform CSPRNG, without modulo bias. */
function randomIndex(max: number): number {
  const limit = Math.floor(0xffffffff / max) * max;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function pick(source: string): string {
  return source[randomIndex(source.length)];
}

/**
 * Generates a password entirely in the browser using crypto.getRandomValues.
 * Nothing is sent anywhere and the value is never logged.
 */
export function generatePassword(length = 20): string {
  const size = Math.max(8, Math.min(64, length));
  // Guarantee one character from each class, then fill and shuffle.
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < size) chars.push(pick(ALPHABET));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Copies text to the clipboard. Returns false instead of throwing when blocked. */
export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the textarea fallback below.
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
