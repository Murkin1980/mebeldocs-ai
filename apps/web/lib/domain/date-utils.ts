const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateString(value: string): { valid: boolean; reason?: string } {
  if (!DATE_REGEX.test(value)) {
    return { valid: false, reason: "Формат даты должен быть YYYY-MM-DD" };
  }

  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) {
    return { valid: false, reason: `Недопустимый месяц: ${monthStr}` };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, reason: `В ${yearStr}-${monthStr} только ${daysInMonth} дней, а указано ${dayStr}` };
  }

  return { valid: true };
}

export function isValidDateString(value: string): boolean {
  return validateDateString(value).valid;
}

/**
 * Returns today's date in Asia/Almaty timezone (UTC+6) as YYYY-MM-DD.
 * Uses Intl.DateTimeFormat to get the correct calendar date.
 */
export function getDefaultDate(): string {
  const now = new Date();
  // UTC+6 offset in milliseconds
  const almatyMs = now.getTime() + 6 * 60 * 60 * 1000;
  const almatyDate = new Date(almatyMs);

  const year = almatyDate.getUTCFullYear();
  const month = String(almatyDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(almatyDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isDateNotAfterToday(value: string): boolean {
  return isDateNotAfterTodayWithReason(value).valid;
}

export function isDateNotAfterTodayWithReason(value: string): { valid: boolean; reason?: string } {
  const dateCheck = validateDateString(value);
  if (!dateCheck.valid) {
    return dateCheck;
  }

  const today = getDefaultDate();

  if (value > today) {
    return { valid: false, reason: "Дата не может быть в будущем" };
  }

  return { valid: true };
}
