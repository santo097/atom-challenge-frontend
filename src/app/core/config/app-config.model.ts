/**
 * Contrato de la configuración runtime de la app.
 *
 * Se carga desde `/config.json` al arrancar (vía APP_INITIALIZER) y
 * se expone a través del `AppConfigService` al resto de la app.
 *
 * Ventaja sobre `environment.ts`:
 *  - Cambiar valores NO requiere rebuild (solo sustituir config.json
 *    en el bucket de hosting).
 *  - Un único bundle sirve para dev/staging/prod.
 *  - CI/CD puede inyectar valores dinámicamente por ambiente sin
 *    mantener múltiples archivos environment.*.ts.
 */
export interface AppConfig {
  /** URL base del API (sin trailing slash). Ej: https://api.dominio.com/api/v1 */
  readonly apiUrl: string;

  /** Nombre del ambiente — se muestra en UI si no es production. */
  readonly environment: 'development' | 'staging' | 'production';

  /** Versión actual desplegada. Útil para debug y reportes de bugs. */
  readonly version: string;

  /** Timeout por defecto para llamadas HTTP en milisegundos. */
  readonly httpTimeoutMs: number;
}

/**
 * Config de fallback en caso de que config.json falle al cargar.
 * Garantiza que la app pueda arrancar (aunque apunte a un backend
 * equivocado) en vez de quedarse en pantalla negra.
 */
export const FALLBACK_CONFIG: AppConfig = {
  apiUrl: 'http://localhost:3000/api/v1',
  environment: 'development',
  version: '0.0.0',
  httpTimeoutMs: 30_000,
};
