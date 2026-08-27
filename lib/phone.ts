/** Moroccan-friendly phone check. Accepts 06/07/05, +212, or international 8–15 digits. */
export function isValidPhone(value: string) {
  const compact = compactPhone(value);
  if (!compact) {
    return false;
  }

  if (/^0[5-7]\d{8}$/.test(compact)) {
    return true;
  }

  if (/^\+212[5-7]\d{8}$/.test(compact)) {
    return true;
  }

  return /^\+[1-9]\d{7,14}$/.test(compact);
}

export function normalizePhone(value: string) {
  const compact = compactPhone(value);
  if (/^0[5-7]\d{8}$/.test(compact)) {
    return `+212${compact.slice(1)}`;
  }
  if (compact.startsWith("00212")) {
    return `+${compact.slice(2)}`;
  }
  return compact;
}

/** Digits-only E.164 for wa.me (no plus). */
export function whatsappDigits(value: string) {
  const normalized = normalizePhone(value);
  const digits = normalized.replace(/[^\d]/g, "");
  return digits.length >= 8 ? digits : "";
}

function compactPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) {
    return `+${digits.slice(2)}`;
  }
  return hasPlus ? `+${digits}` : digits;
}
