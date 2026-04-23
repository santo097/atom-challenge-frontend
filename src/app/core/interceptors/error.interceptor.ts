import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor que detecta errores 401 y cierra la sesión automáticamente.
 *
 * Casos típicos donde dispara:
 *  - El token JWT expiró (el backend usa 1h)
 *  - El JWT_SECRET del server cambió (tokens viejos invalidan)
 *  - El header Authorization se perdió o corrompió
 *
 * En todos los casos, limpiar el estado local + redirigir al login es
 * la respuesta correcta. Otros errores (404, 400, 500) se dejan fluir
 * para que los componentes los manejen con mensajes específicos.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && authService.isAuthenticated()) {
        authService.logout();
        void router.navigate(['/login'], {
          queryParams: { sessionExpired: 'true' },
        });
      }
      return throwError(() => err);
    }),
  );
};
