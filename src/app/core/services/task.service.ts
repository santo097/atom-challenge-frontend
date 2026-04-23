import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { AppConfigService } from '../config';
import type { CreateTaskDto, Task, UpdateTaskDto } from '../models';

/**
 * Servicio que encapsula el CRUD de tareas contra el backend.
 *
 * No guarda estado interno — cada llamada es un round-trip al API.
 * El estado de la lista vive en los componentes. Esta decisión
 * mantiene el servicio simple y facilita testearlo con mocks.
 *
 * La URL base se lee de AppConfigService en cada llamada (getter)
 * en vez de cachearse, porque AppConfigService es singleton y
 * la URL no cambia tras el bootstrap.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  private get baseUrl(): string {
    return `${this.config.apiUrl}/tasks`;
  }

  /**
   * Lista las tareas del usuario autenticado.
   * Viene ordenada DESC por `createdAt` desde el backend.
   *
   * @param completed - si se define, filtra por estado (true/false)
   */
  list(completed?: boolean): Observable<Task[]> {
    let params = new HttpParams();
    if (completed !== undefined) {
      params = params.set('completed', String(completed));
    }
    return this.http.get<Task[]>(this.baseUrl, { params });
  }

  create(dto: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
