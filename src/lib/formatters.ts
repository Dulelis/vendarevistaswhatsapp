const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatPercent(value: number) {
  const decimals = Number.isInteger(value) ? 0 : 1;

  return `${value.toFixed(decimals).replace(".", ",")}%`;
}

export function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(value));
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value);
  const normalized =
    digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;

  if (normalized.length === 11) {
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 7)}-${normalized.slice(7)}`;
  }

  if (normalized.length === 10) {
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)}-${normalized.slice(6)}`;
  }

  return value;
}
