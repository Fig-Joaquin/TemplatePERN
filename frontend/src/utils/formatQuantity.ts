export function formatQuantity(quantity: number): string {
  return quantity.toLocaleString("es-CL", {
    useGrouping: true,
    maximumFractionDigits: 0,
  })
}

