export function toE164PH(input: string) {
  let d = (input || '').replace(/\D/g, '');
  if (d.startsWith('09')) d = '63' + d.slice(1);
  if (/^9\d{9}$/.test(d)) d = '63' + d;
  if (!d.startsWith('63') || d.length !== 12) return null;
  return '+' + d;
}
