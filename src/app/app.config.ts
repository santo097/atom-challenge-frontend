import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { loadAppConfig } from './core/config';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { routes } from './app.routes';

/**
 * Configuración raíz de la aplicación (standalone, sin NgModule).
 *
 * Orden de providers:
 *  1. `provideZonelessChangeDetection()` — modo sin Zone.js (Angular 20)
 *  2. `provideAppInitializer(loadAppConfig)` — carga /config.json ANTES
 *     de que cualquier otro servicio se instancie. Esto garantiza que
 *     cuando Angular crea el AuthService/TaskService, el apiUrl ya
 *     está disponible desde AppConfigService.
 *  3. `provideRouter(...)` — lazy loading + inyección de params
 *  4. `provideHttpClient(...)` — interceptors auth + error en orden
 *  5. `provideAnimationsAsync()` — requerido por Angular Material
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAppInitializer(loadAppConfig),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
  ],
};
