export function formatMoney(amount: bigint): string {
  const num = Number(amount);
  return `₹${num.toLocaleString('en-IN')}`;
}

export function parseMoney(value: string): bigint {
  const cleaned = value.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.floor(num));
}

export function formatPhone(phone: string): string {
  return phone || 'N/A';
}

export function formatPAN(pan: string): string {
  return pan || 'N/A';
}
