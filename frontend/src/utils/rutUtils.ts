// src/utils/rutUtils.ts

/**
 * Formatea un RUT chileno para mostrar con puntos y guión
 * Ejemplo: "12345678" -> "12.345.678-9"
 */
export const formatRut = (rut: string): string => {
  // Limpiar el RUT de puntos, guiones y espacios
  const cleanRut = rut.replace(/[.\-\s]/g, '').toUpperCase();
  
  if (cleanRut.length < 2) return cleanRut;
  
  // Separar el cuerpo del dígito verificador
  const cuerpo = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  // Formatear el cuerpo con puntos
  const cuerpoFormateado = cuerpo.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  
  return `${cuerpoFormateado}-${dv}`;
};

/**
 * Limpia un RUT formateado para enviar al backend
 * Ejemplo: "12.345.678-9" -> "123456789"
 */
export const cleanRut = (rut: string): string => {
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
};

/**
 * Valida el formato y dígito verificador de un RUT chileno
 */
export const validateRut = (rut: string): { isValid: boolean; message?: string } => {
  const cleanedRut = cleanRut(rut);
  
  // Validar longitud
  if (cleanedRut.length < 8 || cleanedRut.length > 9) {
    return { isValid: false, message: "RUT debe tener entre 8 y 9 caracteres" };
  }
  
  // Validar formato (números y K/k al final)
  if (!/^\d+[\dKk]$/.test(cleanedRut)) {
    return { isValid: false, message: "RUT debe contener solo números y dígito verificador (K)" };
  }
  
  // Extraer cuerpo y dígito verificador
  const cuerpo = cleanedRut.slice(0, -1);
  const dv = cleanedRut.slice(-1);
  
  // Calcular dígito verificador
  const calculatedDv = calculateDv(cuerpo);
  
  if (dv !== calculatedDv) {
    return { isValid: false, message: "Dígito verificador del RUT es incorrecto" };
  }
  
  return { isValid: true };
};

/**
 * Calcula el dígito verificador de un RUT
 */
const calculateDv = (cuerpo: string): string => {
  let suma = 0;
  let multiplicador = 2;
  
  // Calcular suma ponderada desde derecha a izquierda
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dv = 11 - resto;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
};

/**
 * Función para manejar el input del RUT con formateo automático
 */
export const handleRutInput = (value: string): string => {
  // Limpiar y limitar a máximo 12 caracteres (con formato)
  const cleaned = cleanRut(value);
  if (cleaned.length > 9) {
    return formatRut(cleaned.slice(0, 9));
  }
  return formatRut(cleaned);
};
