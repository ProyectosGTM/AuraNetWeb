import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';

/**
 * Centraliza el Swal de “campos obligatorios” usado en varios formularios del proyecto
 * (mismo HTML/estilo que agregar-sala, agregar-rol, etc.).
 */
@Injectable({
  providedIn: 'root',
})
export class FormularioValidacionSwalService {
  /**
   * Marca el formulario como touched en todos los controles.
   * Si es inválido, muestra el listado de problemas y devuelve `true` (el caller debe hacer `return`).
   */
  resaltarYAlertarSiInvalido(form: FormGroup, etiquetas: Record<string, string>): boolean {
    form.markAllAsTouched();
    if (form.valid) {
      return false;
    }

    const mensajes = this.construirMensajesDesdeControlesInvalidos(form, etiquetas);
    this.mostrarSwalLista(mensajes);
    return true;
  }

  private construirMensajesDesdeControlesInvalidos(
    form: FormGroup,
    etiquetas: Record<string, string>
  ): string[] {
    const out: string[] = [];
    for (const key of Object.keys(form.controls)) {
      const c = form.get(key);
      if (!c || !c.invalid) {
        continue;
      }
      const label = etiquetas[key] ?? key;
      if (c.errors?.['required']) {
        out.push(label);
      } else if (c.errors?.['email']) {
        out.push(`${label}: formato de correo no válido`);
      } else {
        // Otros validadores (minLength, custom, etc.) o integración con controles de terceros
        out.push(`${label}: revisa el valor`);
      }
    }
    return out;
  }

  private mostrarSwalLista(mensajes: string[]): void {
    const lista =
      mensajes.length > 0
        ? mensajes
            .map(
              (campo, index) => `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">${index + 1}. ${campo}</strong>
        </div>
      `
            )
            .join('')
        : `
        <div style="padding: 8px 12px; border-left: 4px solid #d9534f;
                    background: #caa8a8; text-align: center; margin-bottom: 8px;
                    border-radius: 4px;">
          <strong style="color: #b02a37;">Revisa los campos del formulario.</strong>
        </div>
      `;

    Swal.fire({
      title: '¡Faltan campos obligatorios!',
      background: '#0d121d',
      html: `
        <p style="text-align: center; font-size: 15px; margin-bottom: 16px; color: white">
          Los siguientes <strong>campos obligatorios</strong> están vacíos.<br>
          Por favor complétalos antes de continuar:
        </p>
        <div style="max-height: 350px; overflow-y: auto;">${lista}</div>
      `,
      icon: 'error',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3085d6',
      customClass: { popup: 'swal2-padding swal2-border' },
    });
  }
}
