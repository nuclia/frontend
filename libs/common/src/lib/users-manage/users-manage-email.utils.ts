const EMAIL_SPLIT_REGEX = /[,;\n\r\t\s]+/;
const EMAIL_VALIDATION_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseEmails(input: string): string[] {
  return input
    .split(EMAIL_SPLIT_REGEX)
    .map(normalizeEmail)
    .filter((email) => email.length > 0);
}

export function isValidEmail(email: string): boolean {
  return EMAIL_VALIDATION_REGEX.test(normalizeEmail(email));
}

export function detectDuplicates(emails: string[]): Set<string> {
  const repeated = new Set<string>();
  const seen = new Set<string>();

  emails.forEach((email) => {
    const normalized = normalizeEmail(email);
    if (seen.has(normalized)) {
      repeated.add(normalized);
      return;
    }
    seen.add(normalized);
  });

  return repeated;
}