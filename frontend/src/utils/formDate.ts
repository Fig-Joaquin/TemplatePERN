export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "Sin fecha";
  
  // Crear una nueva fecha sin convertir zona horaria
  const inputDate = new Date(date);
  
  // Ajustar la fecha para mantener el día correcto
  const utcDate = new Date(
    inputDate.getUTCFullYear(),
    inputDate.getUTCMonth(),
    inputDate.getUTCDate()
  );
  
  // Formatear solo fecha sin hora
  return utcDate.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

