import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Task, TaskFilter } from '../../../core/models';
import { TaskItemComponent } from './task-item.component';

/**
 * Lista de tareas con filtros (todas / pendientes / completadas).
 *
 * El filtrado se hace en cliente sobre el array que recibe — no
 * volvemos a llamar al backend al cambiar el filtro. Esto es más
 * rápido y reduce carga en la API. El backend sí soporta
 * `?completed=true/false` si quisiéramos hacerlo server-side.
 *
 * Maneja 3 estados visuales:
 *  - Loading: spinner central
 *  - Empty (sin tareas del todo): hero invitando a crear la primera
 *  - Empty (filtrado sin resultados): mensaje contextual
 */
@Component({
  selector: 'atom-task-list',
  standalone: true,
  imports: [
    TaskItemComponent,
    MatButtonToggleModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="task-list-section">
      <header class="list-header">
        <h2 class="list-title">
          Mis tareas
          @if (!loading() && tasks().length > 0) {
            <span class="count-badge" aria-label="Total de tareas">
              {{ tasks().length }}
            </span>
          }
        </h2>

        @if (tasks().length > 0) {
          <mat-button-toggle-group
            class="filter-group"
            [value]="filter()"
            (change)="filterChange.emit($event.value)"
            aria-label="Filtrar tareas"
            hideSingleSelectionIndicator
          >
            <mat-button-toggle value="all">Todas</mat-button-toggle>
            <mat-button-toggle value="pending">Pendientes</mat-button-toggle>
            <mat-button-toggle value="completed">Completadas</mat-button-toggle>
          </mat-button-toggle-group>
        }
      </header>

      @if (loading()) {
        <div class="center-state" role="status">
          <mat-progress-spinner mode="indeterminate" diameter="48" />
          <p>Cargando tus tareas…</p>
        </div>
      } @else if (tasks().length === 0) {
        <div class="center-state empty-state">
          <mat-icon class="empty-icon" aria-hidden="true">task_alt</mat-icon>
          <h3>Aún no tienes tareas</h3>
          <p>Usa el formulario de arriba para crear tu primera tarea.</p>
        </div>
      } @else if (filteredTasks().length === 0) {
        <div class="center-state empty-state">
          <mat-icon class="empty-icon" aria-hidden="true">filter_alt_off</mat-icon>
          <h3>Sin resultados</h3>
          <p>
            @switch (filter()) {
              @case ('pending') {
                No tienes tareas pendientes. ¡Buen trabajo!
              }
              @case ('completed') {
                Todavía no has completado ninguna tarea.
              }
            }
          </p>
        </div>
      } @else {
        <ul class="task-list" role="list">
          @for (task of filteredTasks(); track task.id) {
            <li>
              <atom-task-item
                [task]="task"
                [busy]="busyTaskIds().has(task.id)"
                (toggleCompleted)="toggleCompleted.emit($event)"
                (edit)="edit.emit($event)"
                (delete)="delete.emit($event)"
              />
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .task-list-section {
      margin-top: 2rem;
    }

    .list-header {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
      }
    }

    .list-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.75rem;
      height: 1.5rem;
      padding: 0 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 999px;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .filter-group {
      @media (max-width: 600px) {
        width: 100%;

        mat-button-toggle {
          flex: 1;
        }
      }
    }

    .task-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .center-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 3rem 1rem;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);

      p {
        margin: 0;
        max-width: 32ch;
      }
    }

    .empty-state h3 {
      margin: 0.5rem 0 0;
      font-size: 1.125rem;
      color: var(--mat-sys-on-surface);
    }

    .empty-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: var(--mat-sys-outline);
    }
  `,
})
export class TaskListComponent {
  readonly tasks = input.required<readonly Task[]>();
  readonly filter = input.required<TaskFilter>();
  readonly loading = input<boolean>(false);
  /** IDs de tareas actualmente en medio de una acción (toggle/delete). */
  readonly busyTaskIds = input<ReadonlySet<string>>(new Set());

  readonly filterChange = output<TaskFilter>();
  readonly toggleCompleted = output<Task>();
  readonly edit = output<Task>();
  readonly delete = output<Task>();

  /**
   * Tareas después de aplicar el filtro actual.
   * Computed signal para recalcular solo cuando cambian inputs.
   */
  protected readonly filteredTasks = computed(() => {
    const all = this.tasks();
    const current = this.filter();
    switch (current) {
      case 'pending':
        return all.filter((t) => !t.completed);
      case 'completed':
        return all.filter((t) => t.completed);
      default:
        return all;
    }
  });
}
