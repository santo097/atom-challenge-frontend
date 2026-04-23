import { Injectable, signal } from '@angular/core';
import { type AppConfig, FALLBACK_CONFIG } from './app-config.model';

/**
 * Servicio singleton que expone la configuración runtime.
 *
 * Patrón de uso:
 *  1. `loadAppConfig()` (APP_INITIALIZER) llama a `bootstrap()` con
 *     el config leído desde /config.json.
 *  2. Todos los servicios/componentes hacen `inject(AppConfigService)`
 *     y leen `apiUrl`, `environment`, etc.
 *
 * Propiedades expuestas como getters para garantizar inmutabilidad
 * tras el bootstrap. Intentar mutar el config en runtime lanzaría error.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly _config = signal<AppConfig>(FALLBACK_CONFIG);
  private _bootstrapped = false;

  /**
   * Se llama una única vez durante el APP_INITIALIZER.
   * Subsecuentes llamadas no tienen efecto (idempotente por diseño).
   */
  bootstrap(config: AppConfig): void {
    if (this._bootstrapped) {
      // eslint-disable-next-line no-console
      console.warn('AppConfigService already bootstrapped; ignoring duplicate call.');
      return;
    }
    this._config.set(config);
    this._bootstrapped = true;
  }

  get apiUrl(): string {
    return this._config().apiUrl;
  }

  get environment(): AppConfig['environment'] {
    return this._config().environment;
  }

  get version(): string {
    return this._config().version;
  }

  get httpTimeoutMs(): number {
    return this._config().httpTimeoutMs;
  }

  get isProduction(): boolean {
    return this._config().environment === 'production';
  }
}
