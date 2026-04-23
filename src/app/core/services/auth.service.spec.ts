import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '../config';
import { FALLBACK_CONFIG } from '../config/app-config.model';
import type { AuthResponse } from '../models';
import { AuthService } from './auth.service';

/**
 * Tests del AuthService.
 * Mockeamos AppConfigService con un apiUrl fijo de pruebas.
 */
describe('AuthService', () => {
  const API_URL = 'http://test-api.local/api/v1';
  let service: AuthService;
  let httpMock: HttpTestingController;

  const fakeResponse: AuthResponse = {
    user: { id: 'u1', email: 'alice@test.com', createdAt: '2026-04-22T00:00:00Z' },
    token: 'fake.jwt.token',
    expiresIn: '1h',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AppConfigService,
          useValue: {
            ...new AppConfigService(),
            apiUrl: API_URL,
            environment: FALLBACK_CONFIG.environment,
            version: FALLBACK_CONFIG.version,
            httpTimeoutMs: FALLBACK_CONFIG.httpTimeoutMs,
            isProduction: false,
            bootstrap: () => undefined,
          },
        },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('arranca sin usuario autenticado', () => {
    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('findUserByEmail', () => {
    it('devuelve el usuario si existe', (done) => {
      service.findUserByEmail('alice@test.com').subscribe((user) => {
        expect(user).toEqual(fakeResponse.user);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/users/alice%40test.com`);
      expect(req.request.method).toBe('GET');
      req.flush(fakeResponse.user);
    });

    it('devuelve null en 404 sin propagar el error', (done) => {
      service.findUserByEmail('ghost@test.com').subscribe({
        next: (user) => {
          expect(user).toBeNull();
          done();
        },
        error: () => fail('No debería propagar el 404'),
      });

      httpMock
        .expectOne(`${API_URL}/users/ghost%40test.com`)
        .flush(null, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('login', () => {
    it('guarda user + token al loguearse con éxito', (done) => {
      service.login('alice@test.com').subscribe(() => {
        expect(service.user()).toEqual(fakeResponse.user);
        expect(service.token()).toBe(fakeResponse.token);
        expect(service.isAuthenticated()).toBe(true);
        expect(localStorage.getItem('atom_token')).toContain(fakeResponse.token);
        done();
      });

      const req = httpMock.expectOne(`${API_URL}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'alice@test.com' });
      req.flush(fakeResponse);
    });

    it('no modifica el estado si el login falla', (done) => {
      service.login('ghost@test.com').subscribe({
        next: () => fail('No debería emitir next'),
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(404);
          expect(service.isAuthenticated()).toBe(false);
          done();
        },
      });

      httpMock
        .expectOne(`${API_URL}/auth/login`)
        .flush(null, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('register', () => {
    it('guarda user + token al registrarse con éxito', (done) => {
      service.register('alice@test.com').subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        expect(service.user()?.email).toBe('alice@test.com');
        done();
      });

      httpMock.expectOne(`${API_URL}/auth/register`).flush(fakeResponse);
    });
  });

  describe('logout', () => {
    it('limpia estado y localStorage', (done) => {
      service.login('alice@test.com').subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);

        service.logout();

        expect(service.user()).toBeNull();
        expect(service.token()).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('atom_token')).toBeNull();
        expect(localStorage.getItem('atom_user')).toBeNull();
        done();
      });

      httpMock.expectOne(`${API_URL}/auth/login`).flush(fakeResponse);
    });
  });
});
