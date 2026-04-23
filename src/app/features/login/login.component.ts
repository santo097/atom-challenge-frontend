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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { extractErrorMessage } from '../../shared/utils/http-error.util';
import {
  normalizeEmail,
  strictEmailValidator,
} from '../../shared/validators/email.validator';

/**
 * Página de login (passwordless) del challenge.
 *
 * Flujo:
 *  1. Usuario ingresa email → se normaliza (lowercase + trim)
 *  2. Se busca si existe (GET /users/:email)
 *  3a. Si existe → login → navega a /tasks
 *  3b. Si NO existe → dialog "¿Crear usuario?" → si confirma:
 *       register → navega a /tasks
 *
 * Mejoras de seguridad y UX aplicadas:
 *  - Validación de email estricta (regex robusta, no la permisiva de Angular)
 *  - Normalización automática — evita usuarios duplicados por mayúsculas
 *  - Estados de carga granulares (verificando/logeando/creando)
 *  - Throttling implícito del botón vía `loading` signal
 *  - Mensajes de error contextualizados (red, 4xx, 5xx) via extractErrorMessage
 */
@Component({
  selector: 'atom-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Estado granular de carga — permite mostrar al usuario qué está
   * pasando exactamente: "Verificando tu cuenta", "Iniciando sesión",
   * o "Creando cuenta". Mejor feedback que un simple "Cargando".
   */
  protected readonly status = signal<'idle' | 'checking' | 'logging-in' | 'registering'>(
    'idle',
  );

  protected readonly loading = computed(() => this.status() !== 'idle');

  protected readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'checking':
        return 'Verificando tu cuenta…';
      case 'logging-in':
        return 'Iniciando sesión…';
      case 'registering':
        return 'Creando cuenta…';
      default:
        return '';
    }
  });

  protected readonly form = this.fb.nonNullable.group({
    email: [
      '',
      {
        validators: [
          Validators.required,
          Validators.maxLength(254),
          strictEmailValidator,
        ],
      },
    ],
  });

  constructor() {
    // Si el usuario ya está autenticado, redirigir directamente a /tasks
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/tasks']);
      return;
    }

    // Notificar si el acceso fue por sesión expirada
    if (this.route.snapshot.queryParamMap.get('sessionExpired') === 'true') {
      this.snackBar.open('Tu sesión expiró. Ingresa de nuevo.', 'Cerrar', {
        duration: 5000,
      });
    }
  }

  /**
   * Handler principal del submit.
   * Mientras `status !== 'idle'`, el botón está deshabilitado —
   * esto previene spam de clicks y peticiones duplicadas al backend.
   */
  protected onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    const email = normalizeEmail(this.form.controls.email.value);
    this.status.set('checking');

    this.authService
      .findUserByEmail(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          if (user) {
            this.doLogin(email);
          } else {
            this.status.set('idle');
            this.askToCreateUser(email);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.status.set('idle');
          this.showError(err, 'No pudimos verificar el usuario.');
        },
      });
  }

  private doLogin(email: string): void {
    this.status.set('logging-in');
    this.authService
      .login(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.navigateToApp(),
        error: (err: HttpErrorResponse) => {
          this.status.set('idle');
          this.showError(err, 'No pudimos iniciar sesión.');
        },
      });
  }

  private doRegister(email: string): void {
    this.status.set('registering');
    this.authService
      .register(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('¡Bienvenido! Tu cuenta se creó correctamente.', 'Cerrar', {
            duration: 3500,
          });
          this.navigateToApp();
        },
        error: (err: HttpErrorResponse) => {
          this.status.set('idle');
          this.showError(err, 'No pudimos crear la cuenta.');
        },
      });
  }

  private askToCreateUser(email: string): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '440px',
        data: {
          title: 'Crear cuenta',
          message:
            `No encontramos una cuenta con el email "${email}". ` +
            `¿Quieres crearla ahora? Podrás empezar a gestionar tus tareas inmediatamente.`,
          confirmText: 'Crear cuenta',
          cancelText: 'Cancelar',
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.doRegister(email);
        }
      });
  }

  private navigateToApp(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/tasks';
    void this.router.navigateByUrl(returnUrl);
  }

  private showError(err: HttpErrorResponse, fallback: string): void {
    const message = extractErrorMessage(err, fallback);
    this.snackBar.open(message, 'Cerrar', { duration: 6000 });
  }

  // --- Helpers para el template ---
  protected emailError(): string | null {
    const ctrl = this.form.controls.email;
    if (!ctrl.touched || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'El email es obligatorio';
    if (ctrl.errors['strictEmail']) return 'Introduce un email válido (ej. tu@dominio.com)';
    if (ctrl.errors['maxlength']) return 'El email es demasiado largo';
    return null;
  }
}
