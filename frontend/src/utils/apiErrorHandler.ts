import { toast } from "react-toastify";

interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Displays one toast per field when the API returns a Zod validation error array,
 * or a single generic toast for any other error type.
 *
 * Backend validation responses have this shape:
 * { message: "Error de validación", errors: [{ field: string, message: string }] }
 */
export function showApiError(error: unknown, fallback = "Ha ocurrido un error"): void {
  const responseData = (error as { response?: { data?: { errors?: ApiFieldError[]; message?: string } } })?.response?.data;

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    responseData.errors.forEach(({ message }) => toast.error(message));
    return;
  }

  const message =
    responseData?.message ??
    (error instanceof Error ? error.message : null) ??
    fallback;

  toast.error(message);
}
