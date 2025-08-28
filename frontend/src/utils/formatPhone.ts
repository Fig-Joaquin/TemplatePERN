/**
 * Formatea un número de teléfono chileno al formato visual estándar
 * @param phone - Número de teléfono (puede incluir o no +56)
 * @returns Número formateado como +569 XXXX XXXX
 */
export const formatChileanPhone = (phone: string): string => {
  if (!phone) return "N/A";
  
  // Remover cualquier caracter que no sea número
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Si ya empieza con 56, agregar el + y formatear
  if (cleanPhone.startsWith("56")) {
    const number = cleanPhone.substring(2); // Remover el 56
    if (number.length === 9) {
      return `+56${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
    }
  }
  
  // Si empieza con 9 y tiene 9 dígitos (formato nacional)
  if (cleanPhone.startsWith("9") && cleanPhone.length === 9) {
    return `+56${cleanPhone.substring(0, 1)} ${cleanPhone.substring(1, 5)} ${cleanPhone.substring(5)}`;
  }
  
  // Si no coincide con ningún formato esperado, devolver tal como está
  return phone;
};

/**
 * Obtiene el nombre completo de una persona incluyendo apellidos
 * @param person - Objeto person con name, first_surname y second_surname opcional
 * @returns Nombre completo formateado
 */
export const getFullName = (person: { name?: string; first_surname?: string; second_surname?: string }): string => {
  if (!person) return "N/A";
  
  const parts = [
    person.name,
    person.first_surname,
    person.second_surname
  ].filter(Boolean); // Filtra valores falsy (undefined, null, "")
  
  return parts.length > 0 ? parts.join(" ") : "N/A";
};

/**
 * Obtiene el kilometraje actual del vehículo
 * @param mileageHistory - Array del historial de kilometraje
 * @returns Kilometraje actual formateado
 */
export const getCurrentMileage = (mileageHistory: any[]): string => {
  if (!mileageHistory || mileageHistory.length === 0) return "N/A";
  
  // Ordenar por fecha de registro descendente y tomar el más reciente
  const sortedHistory = [...mileageHistory].sort((a, b) => 
    new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime()
  );
  
  const currentMileage = sortedHistory[0]?.current_mileage;
  
  if (typeof currentMileage === "number") {
    return `${currentMileage.toLocaleString()} km`;
  }
  
  return "N/A";
};
