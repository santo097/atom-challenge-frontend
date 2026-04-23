import { inject } from '@angular/core';
import { type AppConfig, FALLBACK_CONFIG } from './app-config.model';
import { AppConfigService } from './app-config.service';

/**
 * Factory que carga `/config.json` antes de arrancar la app.
 *
 * Se registra en `app.config.ts` con `provideAppInitializer(...)`.
 * Angular 20 espera a que esta promesa resuelva antes de renderizar
 * el primer componente, garantizando que cuando AuthService, TaskService
 * u otros lean `AppConfigService.apiUrl`, el valor ya esté correcto.
 *
 * Estrategia ante fallo:
 *  - Si /config.json no existe o el JSON es inválido, logueamos un
 *    warning y usamos FALLBACK_CONFIG. La app arrancará apuntando a
 *    localhost — mala config, pero al menos no pantalla en blanco.
 */
export async function loadAppConfig(): Promise<void> {
  const service = inject(AppConfigService);

  try {
    const response = await fetch('/config.json', {
      cache: 'no-cache',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = (await response.json()) as Partial<AppConfig>;
    const config = normalizeConfig(raw);
    service.bootstrap(config);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[AppConfig] Failed to load /config.json, using fallback:',
      err,
    );
    service.bootstrap(FALLBACK_CONFIG);
  }
}

/**
 * Sanea el config leído del JSON:
 *  - Valida que `apiUrl` sea una URL válida
 *  - Rellena campos faltantes con defaults
 *  - Elimina trailing slashes para evitar URLs tipo `/api//users`
 */
function normalizeConfig(raw: Partial<AppConfig>): AppConfig {
  const apiUrl = typeof raw.apiUrl === 'string' ? raw.apiUrl.trim() : '';

  if (!apiUrl || !isValidUrl(apiUrl)) {
    // eslint-disable-next-line no-console
    console.warn('[AppConfig] Invalid or missing apiUrl; using fallback');
    return FALLBACK_CONFIG;
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ''),
    environment: raw.environment ?? FALLBACK_CONFIG.environment,
    version: raw.version ?? FALLBACK_CONFIG.version,
    httpTimeoutMs: raw.httpTimeoutMs ?? FALLBACK_CONFIG.httpTimeoutMs,
  };
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
