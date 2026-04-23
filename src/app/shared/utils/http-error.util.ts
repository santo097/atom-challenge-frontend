import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae un mensaje user-friendly de un HttpErrorResponse.
 *
 * Estrategia de priorización (de más específico a menos):
 *  1. `error.error.message` del backend (ej. "Email already exists")
 *  2. Mapeo por status HTTP (400, 401, 403, 404, 409, 429, 5xx)
 *  3. Mensaje genérico de fallback del llamador
 *
 * También detecta "error de red" (status === 0) cuando el backend
 * está caído o el usuario no tiene internet — caso importante porque
 * muchos errores HTTP normales confunden al usuario en ese escenario.
 */
export function extractErrorMessage(
  err: HttpErrorResponse,
  fallback: string,
): string {
  // 1. Error de red (servidor caído, sin internet, CORS preflight falla, etc.)
  if (err.status === 0) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }

  // 2. Mensaje explícito del backend (respeta la forma que tiene nuestra API)
  const backendMessage =
    (err.error as { error?: { message?: string } } | null)?.error?.message;
  if (backendMessage && typeof backendMessage === 'string') {
    return backendMessage;
  }

  // 3. Mapeo por status HTTP
  switch (err.status) {
    case 400:
      return 'Los datos enviados no son válidos. Revisa el formulario.';
    case 401:
      return 'Tu sesión expiró. Ingresa de nuevo.';
    case 403:
      return 'No tienes permiso para realizar esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 409:
      return 'Ya existe un registro con esos datos.';
    case 429:
      return 'Demasiados intentos. Espera un momento antes de volver a intentar.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'El servidor está teniendo problemas. Intenta de nuevo en unos minutos.';
    default:
      return fallback;
  }
}
