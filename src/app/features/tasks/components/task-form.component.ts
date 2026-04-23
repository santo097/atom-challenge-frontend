import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { CreateTaskDto, Task, UpdateTaskDto } from '../../../core/models';

/**
 * Payload que emite el form cuando se guarda.
 * Si viene del modo "crear" es un CreateTaskDto (sin id).
 * Si viene del modo "editar" incluye los cambios sobre la tarea existente.
 */
export type TaskFormSubmit =
  | { mode: 'create'; value: CreateTaskDto }
  | { mode: 'edit'; value: UpdateTaskDto };

type TaskFormGroup = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
}>;

/**
 * Formulario de tarea — reutilizable para crear y editar.
 *
 * El componente padre le pasa:
 *  - `task`: si se define, entra en modo edición (pre-rellena campos)
 *  - `submitting`: para deshabilitar el botón durante el save
 *
 * Emite:
 *  - `save`: con los datos validados listos para enviar al servicio
 *  - `cancel`: (solo relevante en modo edición) para descartar cambios
 *
 * Layout: vertical, inputs a todo el ancho y botones alineados abajo.
 * Este layout se ve limpio tanto en desktop como en móvil sin truquitos.
 */
@Component({
  selector: 'atom-task-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="handleSubmit()" class="task-form" novalidate>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Título</mat-label>
        <input
          matInput
          formControlName="title"
          placeholder="Ej. Llamar al dentista"
          maxlength="120"
          required
        />
        @if (form.controls.title.touched && form.controls.title.errors; as errors) {
          @if (errors['required']) {
            <mat-error>El título es obligatorio</mat-error>
          } @else if (errors['minlength']) {
            <mat-error>Mínimo 1 carácter</mat-error>
          } @else if (errors['maxlength']) {
            <mat-error>Máximo 120 caracteres</mat-error>
          }
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Descripción (opcional)</mat-label>
        <textarea
          matInput
          formControlName="description"
          placeholder="Detalles adicionales"
          rows="3"
          maxlength="1000"
        ></textarea>
      </mat-form-field>

      <div class="form-actions">
        @if (task()) {
          <button mat-button type="button" (click)="cancel.emit()" [disabled]="submitting()">
            Cancelar
          </button>
        }
        <button
          mat-flat-button
          color="primary"
          type="submit"
          [disabled]="form.invalid || submitting()"
        >
          @if (task()) {
            <ng-container>
              <mat-icon aria-hidden="true">save</mat-icon>
              <span>Guardar cambios</span>
            </ng-container>
          } @else {
            <ng-container>
              <mat-icon aria-hidden="true">add</mat-icon>
              <span>Agregar tarea</span>
            </ng-container>
          }
        </button>
      </div>
    </form>
  `,
  styles: `
    .task-form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;

      button[mat-flat-button] {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        min-width: 160px;
        height: 44px;
      }

      @media (max-width: 480px) {
        flex-direction: column-reverse;
        align-items: stretch;

        button {
          width: 100%;
        }
      }
    }
  `,
})
export class TaskFormComponent {
  private readonly fb = inject(FormBuilder);

  /** Si se pasa una tarea, entra en modo edición. */
  readonly task = input<Task | null>(null);

  /** Deshabilita el botón submit mientras el padre está guardando. */
  readonly submitting = input<boolean>(false);

  readonly save = output<TaskFormSubmit>();
  readonly cancel = output<void>();

  protected readonly form: TaskFormGroup = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  constructor() {
    // Sincronizar el form con el input `task` cuando cambie.
    queueMicrotask(() => this.syncWithTask());
  }

  ngOnChanges(): void {
    this.syncWithTask();
  }

  private syncWithTask(): void {
    const current = this.task();
    if (current) {
      this.form.reset({
        title: current.title,
        description: current.description,
      });
    } else {
      this.form.reset({ title: '', description: '' });
    }
  }

  protected handleSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue() as { title: string; description: string };
    const value = {
      title: raw.title.trim(),
      description: raw.description.trim(),
    };

    if (this.task()) {
      this.save.emit({ mode: 'edit', value });
    } else {
      this.save.emit({ mode: 'create', value });
      // Limpiar el form después de crear (UX estándar)
      this.form.reset({ title: '', description: '' });
    }
  }
}
