import type React from "react"

interface RutFormatterProps {
  rut: string
}

// Función para formatear el RUT, e.g. "202121211" => "20.212.121-1"
export const formatRut = (rut: string): string => {
  // Elimina cualquier caracter que no sea dígito o la letra K/k
  const cleanRut = rut.replace(/[^0-9kK]/g, "")
  if (cleanRut.length < 2) return rut

  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1).toUpperCase()

  // Agrega puntos al cuerpo
  let formattedBody = ""
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    formattedBody = body[i] + formattedBody
    if ((j + 1) % 3 === 0 && i !== 0) {
      formattedBody = "." + formattedBody
    }
  }

  return `${formattedBody}-${dv}`
}

const RutFormatter: React.FC<RutFormatterProps> = ({ rut }) => {
  return <span>{formatRut(rut)}</span>
}

export default RutFormatter

