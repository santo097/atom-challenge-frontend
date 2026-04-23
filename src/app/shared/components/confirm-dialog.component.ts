import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

/**
 * Datos que espera el dialog al abrirse.
 */
export interface ConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly variant?: 'default' | 'danger';
}

/**
 * Dialog genérico de confirmación (Sí / No) reutilizable.
 *
 * Uso típico:
 * ```ts
 * this.dialog
 *   .open(ConfirmDialogComponent, {
 *     data: {
 *       title: '¿Eliminar tarea?',
 *       message: 'Esta acción no se puede deshacer.',
 *       variant: 'danger',
 *       confirmText: 'Eliminar',
 *     },
 *   })
 *   .afterClosed()
 *   .subscribe((confirmed) => { if (confirmed) ... });
 * ```
 */
@Component({
  selector: 'atom-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">
        {{ data.cancelText ?? 'Cancelar' }}
      </button>
      <button
        mat-flat-button
        type="button"
        [color]="data.variant === 'danger' ? 'warn' : 'primary'"
        [mat-dialog-close]="true"
        cdkFocusInitial
      >
        {{ data.confirmText ?? 'Aceptar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content p {
      margin: 0;
      line-height: 1.5;
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}
