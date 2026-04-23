import { Injectable } from '@angular/core';

/**
 * Wrapper tipado alrededor de localStorage.
 *
 * Abstraer esto en un servicio aporta 3 ventajas:
 *  - Fácil de mockear en tests (no dependemos del DOM real)
 *  - Centraliza el manejo de errores de parse JSON
 *  - Permite cambiar el backend (localStorage → sessionStorage → cookies)
 *    sin tocar el código de dominio
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  /**
   * Guarda un valor serializable en localStorage.
   * Si el valor es `null` o `undefined`, elimina la clave en vez de guardar.
   */
  set<T>(key: string, value: T | null): void {
    if (value === null || value === undefined) {
      this.remove(key);
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage puede estar lleno o deshabilitado (modo privado).
      // Falla silenciosamente — el estado simplemente no persistirá.
    }
  }

  /**
   * Lee y deserializa un valor. Si no existe o falla el parse, devuelve null.
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignored
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // ignored
    }
  }
}
