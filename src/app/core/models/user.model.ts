/**
 * Representa un usuario autenticado del sistema.
 * Espeja la respuesta del backend en `/api/v1/auth/*` y `/api/v1/users/*`.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
}
