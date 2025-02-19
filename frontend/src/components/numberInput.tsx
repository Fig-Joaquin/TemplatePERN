"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { formatPriceCLP } from "@/utils/formatPriceCLP"
import { formatQuantity } from "@/utils/formatQuantity"
import type { NumberInputProps } from "@/types/interfaces"

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  className = "",
  placeholder = "",
  id,
  isPrice = false,
  required = false,
}) => {
  const [inputValue, setInputValue] = useState(formatValue(value))

  useEffect(() => {
    setInputValue(formatValue(value))
  }, [value])

  function formatValue(val: number): string {
    if (isPrice) {
      return formatPriceCLP(val)
    } else {
      return formatQuantity(val)
    }
  }

  function parseValue(val: string): number {
    return Number(val.replace(/[^0-9-]/g, ""))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue === "") {
      setInputValue("")
      onChange(0)
    } else {
      const numericValue = parseValue(newValue)
      if (!isNaN(numericValue)) {
        let clampedValue = numericValue
        if (min !== undefined) clampedValue = Math.max(min, clampedValue)
        if (max !== undefined) clampedValue = Math.min(max, clampedValue)
        setInputValue(formatValue(clampedValue))
        onChange(clampedValue)
      }
    }
  }

  const handleBlur = () => {
    if (inputValue === "") {
      setInputValue(formatValue(min))
      onChange(min)
    }
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      id={id}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`text-right ${className}`}
      placeholder={placeholder}
      required={required}
    />
  )
}

