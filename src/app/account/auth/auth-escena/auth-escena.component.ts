import { Component, Input, ViewEncapsulation } from '@angular/core';

/**
 * Escena del login (fondo animado, presentación de AuraNet y tarjeta) para todas las
 * pantallas fuera del sistema. El formulario de cada pantalla va dentro (ng-content).
 */
@Component({
  selector: 'app-auth-escena',
  templateUrl: './auth-escena.component.html',
  styleUrls: ['./auth-escena.component.scss', './auth-escena-campos.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AuthEscenaComponent {
  @Input() icono = 'fas fa-dice';
  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() etiqueta = 'Sala en línea';
  /** Formularios con muchos campos (afiliación): tarjeta más ancha. */
  @Input() amplio = false;
}
