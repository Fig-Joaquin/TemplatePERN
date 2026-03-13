import { type ChangeEvent, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCLPInputValue, parseCLPToInteger } from "@/utils/formatPriceCLP";

interface CurrencyInputCLPProps {
  id?: string;
  value: string;
  onValueChange: (numericValue: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CurrencyInputCLP({
  id,
  value,
  onValueChange,
  placeholder,
  disabled,
}: Readonly<CurrencyInputCLPProps>) {
  const [displayValue, setDisplayValue] = useState(formatCLPInputValue(value));

  useEffect(() => {
    setDisplayValue(formatCLPInputValue(value));
  }, [value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawDigits = event.target.value.match(/\d/g)?.join("") ?? "";
    const numericValue = parseCLPToInteger(rawDigits);
    setDisplayValue(formatCLPInputValue(rawDigits));
    onValueChange(numericValue);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
