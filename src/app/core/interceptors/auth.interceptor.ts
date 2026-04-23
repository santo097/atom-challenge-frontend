import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor que añade el header `Authorization: Bearer <token>` a
 * cada petición al backend.
 *
 * Es funcional (HttpInterceptorFn) — la forma moderna recomendada
 * desde Angular 15+. No hay que registrarlo en ningún módulo: se
 * declara en `app.config.ts` dentro de `provideHttpClient()`.
 *
 * Si no hay token (usuario anónimo) deja la petición pasar tal cual.
 * Las rutas públicas (/auth/login, /auth/register, /users) funcionan
 * con o sin header — el backend las maneja igual.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
