export function normalizePhoneForTel(phone: string): string {
  return phone.replace(/\s+/g, '').trim();
}

export function createTelLink(phone: string): string {
  return `tel:${normalizePhoneForTel(phone)}`;
}
