// RutInput.tsx
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface RutInputProps {
  name: string;
  value: string; // Valor sin formatear (ej: "12234123k" o "122341231")
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  required?: boolean;
  className?: string;
}

/**
 * Función para formatear visualmente el RUT.
 * Ejemplo: "12234123k" -> "12.234.123-K"
 */
export const formatRut = (rut: string): string => {
  const cleanRut = rut.replace(/[^0-9kK]/g, "");
  if (cleanRut.length < 2) return cleanRut;

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  let formattedBody = "";
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    formattedBody = body[i] + formattedBody;
    if ((j + 1) % 3 === 0 && i !== 0) {
      formattedBody = "." + formattedBody;
    }
  }
  return `${formattedBody}-${dv}`;
};

const RutInput: React.FC<RutInputProps> = ({ name, value, onChange, id, required, className }) => {
  // Define el máximo de caracteres que se permiten en el valor sin formato.
  // Por ejemplo, para un RUT de 8 dígitos + dígito verificador, maxLength puede ser 9.
  const maxLength = 9;

  // Estado local para mostrar el valor formateado en tiempo real.
  const [displayValue, setDisplayValue] = useState(formatRut(value));

  useEffect(() => {
    setDisplayValue(formatRut(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Se elimina cualquier caracter de formato (puntos y guión)
    const rawValue = e.target.value.replace(/[.\-]/g, "");
    // Validar que solo contenga dígitos y, opcionalmente, una "k" o "K" al final
    if (!/^\d*(k|K)?$/.test(rawValue)) {
      return;
    }
    // Limitar la cantidad de caracteres ingresados (valor sin formato)
    if (rawValue.length > maxLength) {
      return;
    }
    // Actualizamos el display con el valor formateado en tiempo real
    setDisplayValue(formatRut(rawValue));
    // Creamos un evento simulado para enviar el valor sin formato al onChange del padre
    const simulatedEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: rawValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(simulatedEvent);
  };

  return (
    <Input
      id={id || name}
      type="text"
      name={name}
      value={displayValue}
      onChange={handleChange}
      required={required}
      className={className}
    />
  );
};

export default RutInput;
