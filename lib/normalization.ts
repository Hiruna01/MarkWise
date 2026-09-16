export function registrationKey(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, "");
}
export function normalizeRegistration(value: string): string {
  const key = registrationKey(value);
  const match = /^IT(\d{2})(\d{4})(\d{2})$/.exec(key);
  return match
    ? `IT ${match[1]} ${match[2]} ${match[3]}`
    : value.trim().toUpperCase();
}
