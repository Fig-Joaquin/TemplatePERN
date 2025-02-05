import { formatWithOptions } from "date-fns/fp";
import { es } from "date-fns/locale";

/**
 * Formatea una fecha en formato "dd-MM-yyyy HH:mm" con localización en español.
 * @param date Fecha a formatear
 * @returns Fecha formateada o `null` si la fecha es inválida.
 */
export const formatDate = (date: Date | null): string | null =>
    date ? formatWithOptions({ locale: es }, "dd-MM-yyyy HH:mm")(date) : null;
