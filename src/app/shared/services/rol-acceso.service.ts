import { Injectable } from '@angular/core';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import Swal from 'sweetalert2';

/**
 * Claves de acciones sujetas a validación de rol en UI (extensible).
 * Cada clave tiene ids permitidos alineados con GET /roles/list y `user.rol` / JWT `rol`.
 */
export type AccionConControlRol =
  | 'gestionarCajasCliente'
  | 'registrarAfiliado'
  | 'actualizarNivelVipAfiliado'
  | 'verCumpleanerosAfiliados'
  | 'bloquearAfiliado'
  | 'registrarAutoexclusionAfiliado'
  | 'cancelarAutoexclusionAfiliado'
  | 'abrirTesoreriaDelDia'
  | 'cerrarTesoreriaDelDia'
  | 'reponerEfectivoTurno'
  | 'retirarEfectivoTurno'
  | 'suspenderTurno'
  | 'reactivarTurno'
  | 'corteParcialTurno'
  | 'registrarPromocion'
  | 'descargarEfectivoMonedero'
  | 'ajustarSaldoMonedero'
  | 'cargarMonedero'
  | 'traspasoMonedero'
  | 'reemplazarMonedero'
  | 'gestionarMonedero'
  | 'cambiarEstatusMonedero'
  | 'abrirTurno'
  | 'cerrarTurnoPropio'
  | 'cerrarTurnoForzado'
  | 'retirarTesoreria'
  | 'otorgarBonoVentanilla'
  | 'gestionarBonosAvanzado'
  | 'canjearPuntos'
  | 'cierreManualSesion'
  | 'enrolarRb'
  | 'gestionarUsuarios'
  | 'verBitacora'
  | 'verDashboardSala'
  | 'exigirPinSala'
  | 'vincularTelefonoMonedero'
  | 'revocarTelefonoMonedero';

/** Nombres por id de `user.rol` / login; alineado con `GET /roles/list` (contrato en docs). */
const ROLES_CATALOGO: Record<string, string> = {
  '1': 'SA',
  '2': 'Dev',
  '3': 'Cliente',
  '4': 'Administrador',
  '5': 'Gerente',
  '6': 'Jefe de Sala',
  '7': 'Cajero',
  '8': 'Técnico',
};

/** Primera letra mayúscula y el resto minúsculas en cada palabra (títulos). */
function tituloPorPalabras(texto: string): string {
  return texto
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Primera letra del subtítulo en mayúscula; el resto del texto en minúsculas (una sola oración). */
function subtituloOracion(texto: string): string {
  const t = (texto || '').trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

interface ConfigAccionRol {
  /** Ids de rol (string) que pueden ejecutar la acción. */
  rolesPermitidosIds: string[];
  titulo: string;
  subtitulo: string;
  /** Encabezado sobre la lista de roles (se muestra en formato título). */
  tituloRolesPermitidos: string;
}

/** Etiquetas de rol para mostrar al usuario, sin repetir (p. ej. ids 3 y 5 → ambos "Gerente"). */
function etiquetasRolesPermitidosUnicas(ids: string[]): string[] {
  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const id of ids) {
    const etiqueta = ROLES_CATALOGO[id] ?? id;
    if (vistos.has(etiqueta)) continue;
    vistos.add(etiqueta);
    resultado.push(etiqueta);
  }
  return resultado;
}

const ACCIONES: Record<AccionConControlRol, ConfigAccionRol> = {
  /** Alta y edición de cajas en consola: solo perfil Cliente (misma regla que la validación actual). */
  gestionarCajasCliente: {
    rolesPermitidosIds: ['3'],
    titulo: 'No puedes registrar, ni modificar cajas',
    subtitulo:
      'Con tu usuario no está permitido dar de alta ni modificar cajas. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  registrarAfiliado: {
    /** Alta y edición de afiliados en consola: solo perfil Cliente (misma regla que la validación actual). */
    rolesPermitidosIds: ['5', '6', '7'],
    titulo: 'No puedes agregar, ni actualizar afiliados',
    subtitulo:
      'Con tu usuario no está permitido dar de alta ni modificar afiliados. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  actualizarNivelVipAfiliado: {
    rolesPermitidosIds: ['5'],
    titulo: 'No puedes actualizar, el nivel VIP',
    subtitulo: 'Tu rol no tiene permiso para cambiar el nivel VIP de un afiliado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  verCumpleanerosAfiliados: {
    rolesPermitidosIds: ['1', '2', '3', '4'],
    titulo: 'No puedes ver cumpleañeros',
    subtitulo: 'Tu rol no tiene permiso para consultar el listado de cumpleañeros.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  bloquearAfiliado: {
    /** POST /afiliados/{id}/bloquear — solo Gerente (`user.rol` `"5"` en login auran3t). */
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes bloquear afiliados',
    subtitulo: 'Tu rol no tiene permiso para bloquear afiliados y sus monederos.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  registrarAutoexclusionAfiliado: {
    /** POST /afiliados/{id}/autoexclusion — solo Gerente (`user.rol` `"5"` en login auran3t). */
    rolesPermitidosIds: ['5', '6', '7'],
    titulo: 'No puedes registrar autoexclusión',
    subtitulo: 'Tu rol no tiene permiso para registrar autoexclusión de afiliados.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  cancelarAutoexclusionAfiliado: {
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes cancelar autoexclusión',
    subtitulo: 'Tu rol no tiene permiso para cancelar la autoexclusión de un afiliado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  /** POST /tesorerias/abrir — Gerente y Jefe de Sala (matriz R2). */
  abrirTesoreriaDelDia: {
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes abrir la bóveda del día',
    subtitulo: 'Con tu usuario no está permitido abrir la bóveda. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  /** POST /tesorerias/cerrar — mismo alcance de perfiles que abrir bóveda del día. */
  cerrarTesoreriaDelDia: {
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes cerrar la bóveda del día',
    subtitulo:
      'Con tu usuario no está permitido cerrar la bóveda ni registrar el arqueo final. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  /** POS turnos (matriz R2): reponer, retirar, suspender y reactivar → Gerente y Jefe de Sala; corte parcial → Cajero. */
  reponerEfectivoTurno: {
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes reponer efectivo',
    subtitulo:
      'Con tu usuario no está permitido transferir efectivo de tesorería a caja durante el turno. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  retirarEfectivoTurno: {
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes retirar efectivo',
    subtitulo:
      'Con tu usuario no está permitido retirar efectivo de caja hacia tesorería durante el turno. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  suspenderTurno: {
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes suspender el turno',
    subtitulo:
      'Con tu usuario no está permitido pausar temporalmente un turno de caja. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  reactivarTurno: {
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes reactivar el turno',
    subtitulo:
      'Con tu usuario no está permitido reanudar un turno suspendido. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  corteParcialTurno: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes realizar el corte parcial',
    subtitulo:
      'Con tu usuario no está permitido generar un corte parcial (Corte X) sin cerrar el turno. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  /** Alta de promoción en consola — Cliente y Administrador. */
  registrarPromocion: {
    rolesPermitidosIds: ['3', '4'],
    titulo: 'No puedes registrar promociones',
    subtitulo:
      'Con tu usuario no está permitido dar de alta promociones. Pide apoyo a un usuario con perfil Cliente o Administrador.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  /** Descarga de efectivo desde monedero a caja — solo Cajero (`user.rol` `7`). */
  descargarEfectivoMonedero: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes descargar efectivo del monedero',
    subtitulo:
      'Con tu usuario no está permitido retirar efectivo de un monedero hacia caja. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  /** Ajuste manual de saldo en monedero — solo Gerente (matriz R2). */
  cargarMonedero: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes cargar monederos',
    subtitulo: 'La carga de monederos en ventanilla solo la hace el Cajero.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  traspasoMonedero: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes hacer traspasos',
    subtitulo: 'El traspaso entre monederos solo lo hace el Cajero.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  reemplazarMonedero: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes reemplazar monederos',
    subtitulo: 'El reemplazo de monederos solo lo hace el Cajero.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  gestionarMonedero: {
    rolesPermitidosIds: ['5', '6', '7'],
    titulo: 'No puedes dar de alta ni editar monederos',
    subtitulo: 'Tu rol no tiene permiso para dar de alta ni editar monederos.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  cambiarEstatusMonedero: {
    rolesPermitidosIds: ['5', '6'],
    titulo: 'No puedes cambiar el estatus del monedero',
    subtitulo: 'Solo el Gerente y el Jefe de Sala cambian el estatus de un monedero.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  abrirTurno: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes abrir turno',
    subtitulo: 'Solo el Cajero abre su turno de caja.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  cerrarTurnoPropio: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes cerrar turno',
    subtitulo: 'Solo el Cajero dueño del turno lo cierra. El Gerente usa el cierre forzado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  cerrarTurnoForzado: {
    rolesPermitidosIds: ['5'],
    titulo: 'No puedes forzar el cierre de turnos',
    subtitulo: 'Solo el Gerente cierra el turno de otro cajero.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  retirarTesoreria: {
    rolesPermitidosIds: ['5'],
    titulo: 'No puedes retirar de la bóveda',
    subtitulo: 'Retirar efectivo o ganancia de la bóveda solo lo hace el Gerente.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  otorgarBonoVentanilla: {
    rolesPermitidosIds: ['5', '6', '7'],
    titulo: 'No puedes otorgar bonos',
    subtitulo: 'Tu rol no tiene permiso para otorgar bonos o puntos en ventanilla.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  gestionarBonosAvanzado: {
    rolesPermitidosIds: ['5'],
    titulo: 'No puedes hacer esta operación de bonos',
    subtitulo: 'Bonos con monto manual, masivos, cancelaciones y conversiones solo los hace el Gerente.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  canjearPuntos: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes canjear puntos',
    subtitulo: 'El canje de puntos solo lo hace el Cajero.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  cierreManualSesion: {
    rolesPermitidosIds: ['5'],
    titulo: 'No puedes cerrar sesiones de juego',
    subtitulo: 'El cierre manual de sesiones de juego solo lo hace el Gerente.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  enrolarRb: {
    rolesPermitidosIds: ['5', '8'],
    titulo: 'No puedes enrolar el RB',
    subtitulo: 'El enrolamiento y la revocación del RB los hacen el Gerente y el Técnico.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  gestionarUsuarios: {
    rolesPermitidosIds: ['1', '3', '4', '5'],
    titulo: 'No puedes gestionar usuarios',
    subtitulo: 'Tu rol no tiene permiso para gestionar usuarios.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  verBitacora: {
    rolesPermitidosIds: ['1', '2', '3', '4', '5'],
    titulo: 'No puedes ver la bitácora',
    subtitulo: 'Tu rol no tiene permiso para consultar la bitácora.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  verDashboardSala: {
    rolesPermitidosIds: ['1', '2', '3', '4', '5', '6'],
    titulo: 'No puedes ver el tablero de sala',
    subtitulo: 'Tu rol no tiene permiso para consultar el tablero de sala.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  exigirPinSala: {
    rolesPermitidosIds: ['5'],
    titulo: 'No puedes cambiar el PIN de sala',
    subtitulo: 'Solo el Gerente decide si su sala exige el PIN del monedero.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  vincularTelefonoMonedero: {
    rolesPermitidosIds: ['7'],
    titulo: 'No puedes vincular teléfonos',
    subtitulo: 'La vinculación del monedero digital la hace el Cajero.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  revocarTelefonoMonedero: {
    rolesPermitidosIds: ['5'],
    titulo: 'No puedes revocar teléfonos',
    subtitulo: 'Solo el Gerente revoca un teléfono vinculado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
  ajustarSaldoMonedero: {
    rolesPermitidosIds: ['5'],
    titulo: 'No puedes ajustar saldo de monederos',
    subtitulo:
      'Con tu usuario no está permitido realizar ajustes manuales de saldo en monederos. Pide apoyo a alguien con el perfil indicado.',
    tituloRolesPermitidos: 'Roles que sí pueden realizar esta acción',
  },
};

@Injectable({
  providedIn: 'root',
})
export class RolAccesoService {
  /** Valor de `user.rol` en sesión para perfil cliente (login). Solo uso interno; no mostrar en mensajes al usuario. */
  private readonly rolPerfilClienteSesion = '3';

  /** SA (`1`) y Dev (`2`) deben elegir cliente manualmente en formularios; no usar `idCliente` del login como valor inicial. */
  private readonly idsRolSinClientePorDefecto = new Set<string>(['1', '2']);

  constructor(private auth: AuthenticationService) {}

  /**
   * Convierte el valor de rol (id/string/objeto) a una etiqueta legible para UI.
   */
  obtenerEtiquetaRol(rol: unknown): string {
    if (rol == null) {
      return 'Sin rol';
    }

    if (typeof rol === 'object') {
      const rolObj = rol as Record<string, unknown>;
      const nombreDesdeObjeto = (
        rolObj['rolNombre'] ??
        rolObj['nombre'] ??
        rolObj['name'] ??
        rolObj['descripcion'] ??
        ''
      )
        .toString()
        .trim();

      if (nombreDesdeObjeto) {
        return nombreDesdeObjeto;
      }

      const idDesdeObjeto = (rolObj['id'] ?? rolObj['rolId'] ?? '').toString().trim();
      if (idDesdeObjeto && ROLES_CATALOGO[idDesdeObjeto]) {
        return ROLES_CATALOGO[idDesdeObjeto];
      }

      return 'Sin rol';
    }

    const rolComoTexto = String(rol).trim();
    if (!rolComoTexto) {
      return 'Sin rol';
    }

    return ROLES_CATALOGO[rolComoTexto] ?? rolComoTexto;
  }

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

  /**
   * Roles que no deben recibir el cliente del login precargado en combos (Super Administrador y Desarrollador).
   */
  esRolSinClientePorDefectoEnFormularios(): boolean {
    const r = this.obtenerRolUsuarioLogueado();
    if (r == null || r === '') {
      return false;
    }
    return this.idsRolSinClientePorDefecto.has(r);
  }

  /**
   * `idCliente` del usuario en sesión (respuesta de login en `sessionStorage` user), para precargar combos en altas.
   * No aplica para rol SA (`1`) ni Dev (`2`). Devuelve null si no hay dato válido.
   */
  obtenerIdClientePorDefectoFormulario(): number | null {
    if (this.esRolSinClientePorDefectoEnFormularios()) {
      return null;
    }
    try {
      const u = this.auth.getUser();
      if (u == null) {
        return null;
      }
      const nested = u.user as { idCliente?: unknown } | undefined;
      const raw = u.idCliente ?? nested?.idCliente;
      if (raw != null && raw !== '') {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) {
          return n;
        }
      }
    } catch {
      /* sesión ausente o JSON inválido */
    }
    return null;
  }

  /** Indica si el usuario en sesión tiene perfil cliente (`rol` del login). */
  esPerfilClienteLogueado(): boolean {
    return this.obtenerRolUsuarioLogueado() === this.rolPerfilClienteSesion;
  }

  /**
   * Aviso cuando solo el perfil cliente puede usar cajas, sucursales (salas) o afiliados (alta/edición).
   * Título: mayúscula inicial en cada palabra. Subtítulo: mayúscula solo al inicio.
   */
  mostrarAccesoSoloPerfilCliente(contexto: 'cajas' | 'sucursales' | 'afiliados'): Promise<unknown> {
    const cuerpo =
      contexto === 'cajas'
        ? 'solo pueden registrar o modificar cajas los usuarios con perfil de cliente.'
        : contexto === 'sucursales'
          ? 'solo pueden registrar o modificar sucursales los usuarios con perfil de cliente.'
          : 'solo pueden registrar o modificar afiliados los usuarios con perfil de cliente.';
    const tituloFormateado = `¡${tituloPorPalabras('Acceso restringido')}!`;
    return Swal.fire({
      icon: 'warning',
      title: tituloFormateado,
      text: subtituloOracion(cuerpo),
      background: '#0d121d',
      color: '#e2e8f0',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Entendido',
      didOpen: (popup) => {
        const titleEl = popup.querySelector('.swal2-title') as HTMLElement | null;
        if (titleEl) titleEl.style.textAlign = 'center';
      },
    });
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
    return etiquetasRolesPermitidosUnicas(cfg.rolesPermitidosIds).join(', ');
  }

  /**
   * Diálogo reutilizable: acceso denegado por rol (título + subtítulo + lista de roles permitidos).
   */
  mostrarAccesoDenegado(accion: AccionConControlRol): void {
    const cfg = ACCIONES[accion];
    const items = etiquetasRolesPermitidosUnicas(cfg.rolesPermitidosIds)
      .map((etiqueta) => `<li>${etiqueta}</li>`)
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

  /** Atajo: ¿el usuario en sesión puede realizar la acción? (matriz R2, §8). */
  puede(accion: AccionConControlRol): boolean {
    return this.puedeRealizarAccion(accion, this.obtenerRolUsuarioLogueado());
  }

  /** Igual que `puede`, pero si no puede muestra el aviso de acceso denegado. */
  validar(accion: AccionConControlRol): boolean {
    if (this.puede(accion)) return true;
    this.mostrarAccesoDenegado(accion);
    return false;
  }

  /** Sala de la sesión (login de Gerente, Jefe de Sala, Cajero y Técnico) (§9). */
  obtenerIdSalaSesion(): number | null {
    const u: any = this.auth.getUser();
    const v = Number(u?.idSala ?? u?.sala?.id ?? NaN);
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  /** Roles de sala: el servidor toma idCliente e idSala de la sesión (§9). */
  esUsuarioDeSala(): boolean {
    return ["5", "6", "7", "8"].includes(String(this.obtenerRolUsuarioLogueado() ?? ""));
  }
}
