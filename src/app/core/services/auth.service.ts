import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap, throwError } from 'rxjs';
import { AppConfigService } from '../config';
import type { AuthResponse, User } from '../models';
import { StorageService } from './storage.service';

const STORAGE_KEYS = {
  token: 'atom_token',
  user: 'atom_user',
} as const;

/**
 * Servicio central de autenticación.
 *
 * Usa Angular Signals para exponer el estado reactivo de forma moderna:
 *  - `user()` — usuario actual o null
 *  - `token()` — token JWT actual o null
 *  - `isAuthenticated()` — computed que deriva de los dos anteriores
 *
 * Las llamadas HTTP usan `AppConfigService.apiUrl` en lugar de
 * leer de environment.ts directamente. Esto permite cambiar la URL
 * del backend en runtime sin rebuild (solo editando /config.json).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly config = inject(AppConfigService);

  // --- Estado reactivo (Signals) ---
  private readonly _user = signal<User | null>(this.storage.get<User>(STORAGE_KEYS.user));
  private readonly _token = signal<string | null>(this.storage.get<string>(STORAGE_KEYS.token));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null && this._token() !== null);

  // --- API pública ---

  /**
   * Busca un usuario por email. Útil para decidir entre login y register.
   * Devuelve null si no existe (404) en vez de propagar el error.
   */
  findUserByEmail(email: string): Observable<User | null> {
    const url = `${this.config.apiUrl}/users/${encodeURIComponent(email)}`;
    return this.http.get<User>(url).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) return of(null);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Login con email. Si el usuario no existe, el backend responde 404
   * y el caller debe ofrecer la creación.
   */
  login(email: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.config.apiUrl}/auth/login`, { email })
      .pipe(tap((res) => this.persistSession(res)));
  }

  /**
   * Registra un nuevo usuario y retorna la sesión lista para navegar.
   */
  register(email: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.config.apiUrl}/auth/register`, { email })
      .pipe(tap((res) => this.persistSession(res)));
  }

  /**
   * Cierra sesión: limpia estado y storage.
   */
  logout(): void {
    this._user.set(null);
    this._token.set(null);
    this.storage.remove(STORAGE_KEYS.token);
    this.storage.remove(STORAGE_KEYS.user);
  }

  // --- Helpers privados ---

  private persistSession(res: AuthResponse): void {
    this._user.set(res.user);
    this._token.set(res.token);
    this.storage.set(STORAGE_KEYS.user, res.user);
    this.storage.set(STORAGE_KEYS.token, res.token);
  }
}
