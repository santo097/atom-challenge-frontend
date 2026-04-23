import type { User } from './user.model';

/**
 * DTO para los endpoints de login/register.
 * El backend responde lo mismo en ambos: usuario + token.
 */
export interface AuthRequest {
  readonly email: string;
}

/**
 * Respuesta de un login o register exitoso.
 */
export interface AuthResponse {
  readonly user: User;
  readonly token: string;
  readonly expiresIn: string;
}

/**
 * Estructura del error que devuelve el backend.
 */
export interface ApiErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}
