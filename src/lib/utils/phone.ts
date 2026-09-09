/**
 * Normalizes a phone number by stripping all non-digit characters.
 * 
 * Example:
 * "98765 43210" -> "9876543210"
 * "+91 98765-43210" -> "919876543210"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}
