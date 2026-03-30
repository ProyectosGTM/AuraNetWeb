import { Injectable } from '@angular/core';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import Swal from 'sweetalert2';

/**
 * Claves de acciones sujetas a validación de rol en UI (extensible).
 * Cada clave tiene ids permitidos alineados con GET /roles/list y `user.rol` / JWT `rol`.
 */
export type AccionConControlRol = 'registrarAfiliado' | 'actualizarNivelVipAfiliado';

/** Nombres legibles por id de catálogo de roles (sync con contrato /roles/list). */
const ROLES_CATALOGO: Record<string, string> = {
  '1': 'Super Administrador (SA)',
  '2': 'Administrador',
  '3': 'Gerente',
  '4': 'Jefe de Sala',
  '5': 'Cajero',
  '6': 'Jugador',
};

/** Primera letra mayúscula y el resto minúsculas en cada palabra (títulos). */
function tituloPorPalabras(texto: string): string {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

interface ConfigAccionRol {
  /** Ids de rol (string) que pueden ejecutar la acción. */
  rolesPermitidosIds: string[];
  titulo: string;
  subtitulo: string;
  /** Encabezado sobre la lista de roles (se muestra en formato título). */
  tituloRolesPermitidos: string;
}

const ACCIONES: Record<AccionConControlRol, ConfigAccionRol> = {
  registrarAfiliado: {
    /**
     * POST /afiliados — personal operativo (excluye Jugador en consola de gestión).
     * Ajustar ids si negocio autoriza más roles.
     */
    rolesPermitidosIds: ['1', '2', '3', '4', '5'],
    titulo: 'No puedes registrar afiliados',
    subtitulo: 'Tu rol actual no tiene permiso para crear registros de afiliados.',
    /** Texto del encabezado de la lista de roles (se formatea como título en el modal). */
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  actualizarNivelVipAfiliado: {
    /** POST /afiliados/{id}/nivel-vip — Swagger: rol Gerente (id 2). */
    rolesPermitidosIds: ['2'],
    titulo: 'No puedes actualizar el nivel VIP',
    subtitulo:
      'Tu rol no tiene permiso para cambiar el nivel VIP. La API documenta el rol autorizado como Gerente (identificador 2).',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
};

@Injectable({
  providedIn: 'root',
})
export class RolAccesoService {
  constructor(private auth: AuthenticationService) {}

  /**
   * Rol del usuario en sesión (`user.rol`), como string; null si no hay sesión válida.
   */
  obtenerRolUsuarioLogueado(): string | null {
    try {
      const u = this.auth.getUser();
      if (u == null || u.rol === undefined || u.rol === null) {
        return null;
      }
      return String(u.rol).trim();
    } catch {
      return null;
    }
  }

  puedeRealizarAccion(accion: AccionConControlRol, rolUsuario: string | null | undefined): boolean {
    const cfg = ACCIONES[accion];
    const r = rolUsuario == null ? '' : String(rolUsuario).trim();
    if (!r) {
      return false;
    }
    return cfg.rolesPermitidosIds.includes(r);
  }

  /**
   * Texto multilínea con los roles que sí pueden (para tooltips, etc.).
   */
  obtenerTextoRolesAutorizados(accion: AccionConControlRol): string {
    const cfg = ACCIONES[accion];
    return cfg.rolesPermitidosIds
      .map((id) => ROLES_CATALOGO[id] ?? `Rol ${id}`)
      .join(', ');
  }

  /**
   * Diálogo reutilizable: acceso denegado por rol (título + subtítulo + lista de roles permitidos).
   */
  mostrarAccesoDenegado(accion: AccionConControlRol): void {
    const cfg = ACCIONES[accion];
    const items = cfg.rolesPermitidosIds
      .map((id) => `<li>${ROLES_CATALOGO[id] ?? id}</li>`)
      .join('');
    const tituloFormateado = `¡${tituloPorPalabras(cfg.titulo)}!`;
    const encabezadoRoles = tituloPorPalabras(cfg.tituloRolesPermitidos);

    Swal.fire({
      icon: 'warning',
      title: tituloFormateado,
      html:
        `<div style="text-align:center">` +
        `<p style="margin:0 0 14px;color:#e2e8f0;line-height:1.45">${cfg.subtitulo}</p>` +
        `<p style="margin:0 0 10px;color:#94a3b8;font-size:13px"><strong>${encabezadoRoles}:</strong></p>` +
        `<ul style="margin:0;padding:0;list-style-position:inside;color:#cbd5e1;font-size:13px;line-height:1.6;display:inline-block;text-align:center">${items}</ul>` +
        `</div>`,
      background: '#0d121d',
      color: '#e2e8f0',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Entendido',
      didOpen: (popup) => {
        const titleEl = popup.querySelector('.swal2-title') as HTMLElement | null;
        if (titleEl) {
          titleEl.style.textAlign = 'center';
        }
        const htmlEl = popup.querySelector('.swal2-html-container') as HTMLElement | null;
        if (htmlEl) {
          htmlEl.style.textAlign = 'center';
        }
      },
    });
  }
}
