const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const normalizeCurrencyText = (value: string): string => value.match(/\S/g)?.join("") ?? "";

export const formatPriceCLP = (amount: number | string | null | undefined): string => {
  const numericAmount =
    typeof amount === "string" ? Number.parseInt(amount, 10) : Number(amount ?? 0);

  if (!Number.isFinite(numericAmount)) {
    return "$0";
  }

  return normalizeCurrencyText(clpFormatter.format(Math.trunc(numericAmount)));
};

export const parseCLPToInteger = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.trunc(value);
  }

  const onlyDigits = value.match(/\d/g)?.join("") ?? "";
  if (!onlyDigits) {
    return null;
  }

  const parsed = Number.parseInt(onlyDigits, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatCLPInputValue = (rawDigits: string): string => {
  const digits = rawDigits.match(/\d/g)?.join("") ?? "";
  if (!digits) {
    return "";
  }

  return formatPriceCLP(Number.parseInt(digits, 10));
};
