import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Regex de email más estricto que el de Angular.
 *
 * El `Validators.email` de Angular acepta cosas como `a@b` (sin TLD)
 * o `user@localhost`. Esta regex requiere:
 *  - Al menos un carácter antes del @
 *  - Al menos un dominio con punto (ej. example.com)
 *  - TLD de mínimo 2 caracteres
 *  - Sin espacios ni caracteres raros
 *
 * No usa lookbehinds para mantener compatibilidad con navegadores viejos.
 *
 * Deliberadamente NO usamos una regex "perfecta RFC 5322" porque son
 * cientos de líneas y no aportan valor práctico — 99% de los emails
 * inválidos del mundo real los captura esta versión simple.
 */
const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

/**
 * Validador reactivo que aplica la regex estricta.
 * Se compone con Validators.required y Validators.maxLength en el form.
 */
export const strictEmailValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;

  // Campos vacíos los deja pasar — de eso se encarga Validators.required.
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return { strictEmail: true };
  }

  const normalized = value.trim().toLowerCase();

  if (!STRICT_EMAIL_REGEX.test(normalized)) {
    return { strictEmail: true };
  }

  // Longitud máxima razonable (RFC: 254 en total, 64 local, 253 dominio).
  if (normalized.length > 254) {
    return { strictEmail: true };
  }

  return null;
};

/**
 * Normaliza un email para envío al backend:
 *  - Trim de espacios
 *  - Lowercase
 *
 * Usado en onSubmit() para garantizar consistencia entre lookups
 * (ej. "Foo@Bar.com" y "foo@bar.com" deben resolver al mismo usuario).
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
