import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que permite el acceso solo si hay sesión activa.
 * Se aplica a la ruta `/tasks` (página principal).
 *
 * Si el usuario no está autenticado, redirige a `/login` guardando
 * la URL destino en `returnUrl` — tras loguearse, se navega de vuelta.
 */
export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
