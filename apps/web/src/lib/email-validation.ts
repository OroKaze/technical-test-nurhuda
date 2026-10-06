export const DEFAULT_COMPANY_EMAIL_DOMAIN = 'dexagroup.com';

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail?: string;
}

/**
 * Validates company email strictly against @dexagroup.com (or provided company domain).
 * - Enforces required format
 * - Enforces minimum 2-character local part
 * - Disallows invalid characters and consecutive dots
 * - Strictly validates official company domain
 */
export function validateCompanyEmail(
  rawEmail: string,
  allowedDomain: string = DEFAULT_COMPANY_EMAIL_DOMAIN,
): EmailValidationResult {
  const trimmed = rawEmail.trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Email perusahaan wajib diisi.',
    };
  }

  let emailToTest = trimmed;
  if (!emailToTest.includes('@')) {
    emailToTest = `${emailToTest}@${allowedDomain}`;
  }

  const normalized = emailToTest.toLowerCase();
  const atIndex = normalized.lastIndexOf('@');

  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return {
      isValid: false,
      error: 'Format email tidak valid.',
    };
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  const localPartRegex = /^[a-z0-9]([a-z0-9._%+-]*[a-z0-9])?$/;
  if (localPart.length < 2 || !localPartRegex.test(localPart) || localPart.includes('..')) {
    return {
      isValid: false,
      error: 'Username email minimal 2 karakter dan hanya boleh berisi huruf, angka, serta tanda baca yang valid.',
    };
  }

  if (domain !== allowedDomain.toLowerCase()) {
    return {
      isValid: false,
      error: `Email harus menggunakan domain resmi perusahaan (@${allowedDomain}).`,
    };
  }

  return {
    isValid: true,
    normalizedEmail: normalized,
  };
}

/**
 * Normalizes company email input.
 * If user only types username without @, automatically attaches the default company domain.
 */
export function normalizeCompanyEmail(
  rawEmail: string,
  domain: string = DEFAULT_COMPANY_EMAIL_DOMAIN,
): string {
  const trimmed = rawEmail.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('@')) {
    return `${trimmed}@${domain}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}
