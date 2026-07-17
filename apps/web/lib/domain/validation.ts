export function isValidBinIin(value: string): boolean {
  const cleaned = value.replace(/[\s\-()]/g, "");
  if (!/^\d{12}$/.test(cleaned) && !/^\d{10}$/.test(cleaned)) {
    return false;
  }
  return true;
}

export function formatBinIin(value: string): string {
  const cleaned = value.replace(/[\s\-()]/g, "");
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return value;
}

export function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${fieldName} is required`);
  }
}

export function validatePositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
}

export function validateNonNegative(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
}
