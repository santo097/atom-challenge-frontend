import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { Task } from '../../../core/models';

/**
 * Tarjeta de una tarea individual.
 *
 * Responsabilidades:
 *  - Renderizar título, descripción, fecha y estado
 *  - Ofrecer checkbox para toggle completado/pendiente
 *  - Menú de acciones (editar, eliminar)
 *
 * Todas las acciones son "optimistic-free" — no muta su input, solo
 * emite eventos que el padre decide si persistir o no. Esto hace el
 * componente puramente presentacional y fácil de testear.
 */
@Component({
  selector: 'atom-task-item',
  standalone: true,
  imports: [
    DatePipe,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="task-card"
      [class.completed]="task().completed"
      [attr.aria-label]="'Tarea: ' + task().title"
    >
      <mat-checkbox
        class="task-checkbox"
        [checked]="task().completed"
        [disabled]="busy()"
        (change)="toggleCompleted.emit(task())"
        [attr.aria-label]="
          task().completed ? 'Marcar como pendiente' : 'Marcar como completada'
        "
      />

      <div class="task-body">
        <h3 class="task-title">{{ task().title }}</h3>
        @if (task().description) {
          <p class="task-description">{{ task().description }}</p>
        }
        <time
          class="task-date"
          [attr.datetime]="task().createdAt"
          [matTooltip]="task().createdAt | date: 'medium'"
        >
          {{ task().createdAt | date: 'd MMM, HH:mm' }}
        </time>
      </div>

      <div class="task-actions">
        <button
          mat-icon-button
          type="button"
          [matMenuTriggerFor]="menu"
          [disabled]="busy()"
          aria-label="Más acciones"
        >
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item type="button" (click)="edit.emit(task())">
            <mat-icon>edit</mat-icon>
            <span>Editar</span>
          </button>
          <button mat-menu-item type="button" (click)="delete.emit(task())">
            <mat-icon color="warn">delete</mat-icon>
            <span>Eliminar</span>
          </button>
        </mat-menu>
      </div>
    </article>
  `,
  styles: `
    .task-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: start;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--mat-sys-surface);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      transition:
        border-color var(--transition-base),
        background var(--transition-base),
        transform var(--transition-base);

      &:hover {
        border-color: var(--mat-sys-outline);
      }

      &.completed {
        background: var(--mat-sys-surface-container-lowest);

        .task-title {
          text-decoration: line-through;
          color: var(--mat-sys-on-surface-variant);
        }

        .task-description {
          color: var(--mat-sys-on-surface-variant);
        }
      }
    }

    .task-checkbox {
      // Subir el checkbox 2px para alinear visualmente con el título
      margin-top: 2px;
    }

    .task-body {
      min-width: 0; // permite truncar texto largo sin romper el grid
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .task-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      line-height: 1.3;
      color: var(--mat-sys-on-surface);
      overflow-wrap: anywhere;
    }

    .task-description {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
      color: var(--mat-sys-on-surface-variant);
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    .task-date {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 0.25rem;
    }

    .task-actions {
      align-self: start;
    }
  `,
})
export class TaskItemComponent {
  readonly task = input.required<Task>();
  readonly busy = input<boolean>(false);

  readonly toggleCompleted = output<Task>();
  readonly edit = output<Task>();
  readonly delete = output<Task>();
}
