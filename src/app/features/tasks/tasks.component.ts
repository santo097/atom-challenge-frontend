import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import type { Task, TaskFilter } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import {
  TaskFormComponent,
  type TaskFormSubmit,
} from './components/task-form.component';
import { TaskListComponent } from './components/task-list.component';

/**
 * Página principal: lista de tareas + formulario de creación/edición.
 *
 * Arquitectura del estado (con Signals):
 *  - `tasks`:       source-of-truth local, sincronizado al cargar
 *  - `loading`:     flag para el estado inicial (GET /tasks)
 *  - `saving`:      flag para el form al crear/editar
 *  - `editingTask`: tarea en modo edición (null = modo crear)
 *  - `busyIds`:     set con IDs de tareas en medio de una acción
 *  - `filter`:      filtro activo (all/pending/completed)
 *
 * Patrón de updates: **optimistic-like con rollback en error**.
 * Al togglear, actualizamos el signal localmente y hacemos PUT;
 * si falla, revertimos y mostramos snackbar con mensaje contextualizado.
 *
 * Los errores HTTP se traducen via `extractErrorMessage` para mostrar
 * mensajes user-friendly según status (400, 401, 403, 404, 5xx, red).
 */
@Component({
  selector: 'atom-tasks',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    TaskFormComponent,
    TaskListComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.scss',
})
export class TasksComponent {
  private readonly authService = inject(AuthService);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // --- Estado ---
  protected readonly tasks = signal<readonly Task[]>([]);
  protected readonly loading = signal<boolean>(true);
  protected readonly saving = signal<boolean>(false);
  protected readonly editingTask = signal<Task | null>(null);
  protected readonly busyIds = signal<ReadonlySet<string>>(new Set());
  protected readonly filter = signal<TaskFilter>('all');

  // --- Derivados ---
  protected readonly user = this.authService.user;
  protected readonly userInitial = computed(() => {
    const email = this.user()?.email ?? '';
    return email.charAt(0).toUpperCase() || '?';
  });

  constructor() {
    this.loadTasks();
  }

  // =====================================================================
  //  Carga inicial
  // =====================================================================
  private loadTasks(): void {
    this.loading.set(true);
    this.taskService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          // 401 lo maneja el errorInterceptor. Los demás los mostramos aquí.
          if (err.status !== 401) {
            this.showError(err, 'No pudimos cargar tus tareas.');
          }
        },
      });
  }

  // =====================================================================
  //  Crear / editar
  // =====================================================================
  protected onFormSubmit(payload: TaskFormSubmit): void {
    if (payload.mode === 'create') {
      this.createTask(payload.value.title, payload.value.description ?? '');
    } else {
      const current = this.editingTask();
      if (current) {
        this.updateTask(current, payload.value);
      }
    }
  }

  private createTask(title: string, description: string): void {
    this.saving.set(true);
    this.taskService
      .create({ title, description })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (created) => {
          // Prepend: la tarea más reciente va arriba (como el backend ordena)
          this.tasks.update((current) => [created, ...current]);
          this.saving.set(false);
          this.snackBar.open('Tarea creada', 'Cerrar', { duration: 2500 });
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.showError(err, 'No pudimos crear la tarea.');
        },
      });
  }

  private updateTask(
    current: Task,
    changes: { title?: string; description?: string; completed?: boolean },
  ): void {
    this.saving.set(true);
    this.markBusy(current.id, true);

    this.taskService
      .update(current.id, changes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
          this.saving.set(false);
          this.markBusy(current.id, false);
          this.editingTask.set(null);
          this.snackBar.open('Cambios guardados', 'Cerrar', { duration: 2500 });
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.markBusy(current.id, false);
          this.showError(err, 'No pudimos guardar los cambios.');
        },
      });
  }

  protected onEditClicked(task: Task): void {
    this.editingTask.set(task);
    // Scroll al form para que el usuario vea el cambio de modo
    queueMicrotask(() => {
      document.getElementById('task-form-anchor')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  protected onEditCanceled(): void {
    this.editingTask.set(null);
  }

  // =====================================================================
  //  Toggle completado (actualización optimista)
  // =====================================================================
  protected onToggleCompleted(task: Task): void {
    const nextValue = !task.completed;
    // Optimistic update
    this.tasks.update((list) =>
      list.map((t) => (t.id === task.id ? { ...t, completed: nextValue } : t)),
    );
    this.markBusy(task.id, true);

    this.taskService
      .update(task.id, { completed: nextValue })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
          this.markBusy(task.id, false);
        },
        error: (err: HttpErrorResponse) => {
          // Rollback
          this.tasks.update((list) =>
            list.map((t) => (t.id === task.id ? { ...t, completed: !nextValue } : t)),
          );
          this.markBusy(task.id, false);
          this.showError(err, 'No pudimos actualizar la tarea.');
        },
      });
  }

  // =====================================================================
  //  Eliminar (con confirmación)
  // =====================================================================
  protected onDeleteClicked(task: Task): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title: 'Eliminar tarea',
          message: `¿Seguro que quieres eliminar "${task.title}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          variant: 'danger' as const,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performDelete(task);
        }
      });
  }

  private performDelete(task: Task): void {
    this.markBusy(task.id, true);
    this.taskService
      .delete(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.tasks.update((list) => list.filter((t) => t.id !== task.id));
          if (this.editingTask()?.id === task.id) {
            this.editingTask.set(null);
          }
          this.markBusy(task.id, false);
          this.snackBar.open('Tarea eliminada', 'Cerrar', { duration: 2500 });
        },
        error: (err: HttpErrorResponse) => {
          this.markBusy(task.id, false);
          this.showError(err, 'No pudimos eliminar la tarea.');
        },
      });
  }

  // =====================================================================
  //  Filtros
  // =====================================================================
  protected onFilterChange(filter: TaskFilter): void {
    this.filter.set(filter);
  }

  // =====================================================================
  //  Logout
  // =====================================================================
  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  // =====================================================================
  //  Helpers
  // =====================================================================
  private markBusy(id: string, busy: boolean): void {
    this.busyIds.update((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  private showError(err: HttpErrorResponse, fallback: string): void {
    const message = extractErrorMessage(err, fallback);
    this.snackBar.open(message, 'Cerrar', { duration: 6000 });
  }
}
