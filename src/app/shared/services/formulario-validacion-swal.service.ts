import { campoDeEtiqueta } from 'src/app/shared/utils/ir-a-campo';
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
    this.mostrarSwalLista(mensajes, etiquetas);
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

  private mostrarSwalLista(mensajes: string[], etiquetas: Record<string, string>): void {
    const lista =
      mensajes.length > 0
        ? mensajes
            .map(
              (campo, index) => `
        <div class="sw-falta" data-campo="${campoDeEtiqueta(etiquetas, campo)}" role="button" tabindex="0" style="--i:${index}"><span class="sw-falta-n">${index + 1}</span><span class="sw-falta-t">${campo}</span><i class="fas fa-exclamation-circle sw-falta-i"></i></div>
      `
            )
            .join('')
        : `
        <div class="sw-falta"><span class="sw-falta-n">!</span><span class="sw-falta-t">Revisa los campos del formulario.</span><i class="fas fa-exclamation-circle sw-falta-i"></i></div>
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
