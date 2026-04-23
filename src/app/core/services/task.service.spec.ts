import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '../config';
import type { Task } from '../models';
import { TaskService } from './task.service';

describe('TaskService', () => {
  const API_URL = 'http://test-api.local/api/v1';
  let service: TaskService;
  let httpMock: HttpTestingController;

  const fakeTask: Task = {
    id: 't1',
    userId: 'u1',
    title: 'Test task',
    description: 'demo',
    completed: false,
    createdAt: '2026-04-22T00:00:00Z',
    updatedAt: '2026-04-22T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AppConfigService,
          useValue: {
            apiUrl: API_URL,
            environment: 'development' as const,
            version: 'test',
            httpTimeoutMs: 5000,
            isProduction: false,
            bootstrap: () => undefined,
          },
        },
      ],
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('list', () => {
    it('hace GET sin query params cuando no se pasa filtro', (done) => {
      service.list().subscribe((tasks) => {
        expect(tasks).toEqual([fakeTask]);
        done();
      });

      const req = httpMock.expectOne(API_URL + '/tasks');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([fakeTask]);
    });

    it('añade ?completed=true al filtrar completadas', (done) => {
      service.list(true).subscribe(() => done());

      const req = httpMock.expectOne((r) => r.url === API_URL + '/tasks');
      expect(req.request.params.get('completed')).toBe('true');
      req.flush([]);
    });

    it('añade ?completed=false al filtrar pendientes', (done) => {
      service.list(false).subscribe(() => done());

      const req = httpMock.expectOne((r) => r.url === API_URL + '/tasks');
      expect(req.request.params.get('completed')).toBe('false');
      req.flush([]);
    });
  });

  describe('create', () => {
    it('hace POST con el DTO correcto', (done) => {
      service.create({ title: 'nueva', description: 'desc' }).subscribe((task) => {
        expect(task).toEqual(fakeTask);
        done();
      });

      const req = httpMock.expectOne(API_URL + '/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: 'nueva', description: 'desc' });
      req.flush(fakeTask);
    });
  });

  describe('update', () => {
    it('hace PUT con el id en la URL y los campos en body', (done) => {
      service.update('t1', { completed: true }).subscribe(() => done());

      const req = httpMock.expectOne(API_URL + '/tasks/t1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ completed: true });
      req.flush(fakeTask);
    });
  });

  describe('delete', () => {
    it('hace DELETE con el id en la URL', (done) => {
      service.delete('t1').subscribe(() => done());

      const req = httpMock.expectOne(API_URL + '/tasks/t1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
