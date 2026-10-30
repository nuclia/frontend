export const SENDER_NAME_MAX_LENGTH = 64;

const FORBIDDEN_CHARS = ['<', '>', '@'];
// Mirrors Python's str.isprintable() used by the backend: control/format/unassigned characters and every
// separator other than the plain space are rejected.
const NON_PRINTABLE = /[\p{C}\p{Z}]/u;

export function normalizeSenderName(name: string): string {
  return name.trim();
}

/** Returns an error message when the sender name is invalid, `null` otherwise. Mirrors the backend validation. */
export function validateSenderName(name: string): string | null {
  const value = normalizeSenderName(name);
  if ([...value].length > SENDER_NAME_MAX_LENGTH) {
    return `Sender name can have at most ${SENDER_NAME_MAX_LENGTH} characters.`;
  }
  if ([...value].some((char) => FORBIDDEN_CHARS.includes(char) || (char !== ' ' && NON_PRINTABLE.test(char)))) {
    return 'Sender name cannot contain the characters < > @ or control characters.';
  }
  return null;
}
