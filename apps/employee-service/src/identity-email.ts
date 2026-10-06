export function isCompanyEmail(email: string, companyDomain: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedDomain = companyDomain.trim().toLowerCase();
  const separatorIndex = normalizedEmail.lastIndexOf('@');

  if (separatorIndex <= 0 || separatorIndex === normalizedEmail.length - 1) return false;

  const localPart = normalizedEmail.slice(0, separatorIndex);
  const domain = normalizedEmail.slice(separatorIndex + 1);
  if (localPart.includes(' ') || domain.includes(' ') || !domain.includes('.')) return false;

  return domain === normalizedDomain;
}
