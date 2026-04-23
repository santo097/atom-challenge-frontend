import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Routing raíz de la app.
 *
 * Todas las rutas con componentes pesados usan `loadComponent` (lazy)
 * para que el bundle inicial sea pequeño — solo se carga el código
 * de login al arrancar; `/tasks` se descarga solo cuando se navega.
 *
 * La ruta `/tasks` está protegida por `authGuard`: si no hay sesión,
 * redirige a `/login` con `returnUrl` en el queryString.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sesión · ATOM Tasks',
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/tasks.component').then((m) => m.TasksComponent),
    title: 'Mis tareas · ATOM Tasks',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
