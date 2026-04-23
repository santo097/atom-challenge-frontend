import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente raíz de la app.
 *
 * Intencionalmente minimalista: solo renderiza el router-outlet.
 * La UI (toolbar, etc.) la pone cada página porque en `/login` no
 * queremos toolbar y en `/tasks` sí — mejor que cada página controle
 * su propio layout que imponer uno global.
 */
@Component({
  selector: 'atom-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet />`,
})
export class AppComponent {}
