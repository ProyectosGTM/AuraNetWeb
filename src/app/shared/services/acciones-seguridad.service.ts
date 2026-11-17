import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { UsuariosService } from './usuario.service';
import { SalaService } from './salas.service';
import { MaquinasService } from './maquinas.service';
import { MonederosServices } from './monederos.service';
import { SegundoFactorService } from './segundo-factor.service';
import { RolAccesoService } from './rol-acceso.service';
import { PinSalaService } from './pin-sala.service';
import { mensajeError } from '../utils/api-error';

const BASE = { background: '#0d121d', confirmButtonColor: '#e40041', cancelButtonColor: '#3a3f4b' };

/**
 * Acciones de seguridad que se disparan desde los grids (ESPECIFICACION_FRONT §7, §10, §13).
 * Todo con diálogos homologados para no repetir lógica en cada pantalla.
 */
@Injectable({ providedIn: 'root' })
export class AccionesSeguridadService {
  constructor(
    private usuarios: UsuariosService,
    private salas: SalaService,
    private maquinas: MaquinasService,
    private monederos: MonederosServices,
    private segundoFactor: SegundoFactorService,
    private rolAcceso: RolAccesoService,
    private pinSala: PinSalaService,
  ) { }

  private nombreUsuario(u: any): string {
    const armado = `${u?.nombre ?? u?.Nombre ?? ''} ${u?.apellidoPaterno ?? u?.ApellidoPaterno ?? ''}`.trim();
    return u?.NombreCompleto || u?.nombreCompleto || armado || u?.UserName || u?.userName || 'este usuario';
  }

  private idUsuario(u: any): number {
    return Number(u?.id ?? u?.Id ?? u?.idUsuario ?? u?.IdUsuario);
  }

  private error(e: any, porDefecto: string) {
    Swal.fire({ ...BASE, icon: 'error', title: '¡Ops!', text: mensajeError(e, porDefecto) });
  }

  private confirmar(titulo: string, html: string, boton: string): Promise<boolean> {
    return Swal.fire({ ...BASE, icon: 'warning', title: titulo, html, showCancelButton: true, confirmButtonText: boton, cancelButtonText: 'Cancelar' })
      .then((r) => !!r.isConfirmed);
  }

  /** §7: contraseña temporal; el usuario entra con debeCambiarPassword. */
  async reiniciarContrasena(u: any) {
    if (!this.rolAcceso.validar('gestionarUsuarios')) return;
    const nombre = this.nombreUsuario(u);
    if (!(await this.confirmar('¡Reiniciar Contraseña!', `Se generará una contraseña temporal para <strong>${nombre}</strong>. Deberá cambiarla al entrar.`, 'Reiniciar'))) return;
    this.usuarios.reiniciarContrasena(this.idUsuario(u)).subscribe({
      next: (r: any) => {
        const d = r?.data ?? r;
        const temp = typeof d === 'string' ? d : (d?.passwordTemporal ?? d?.contrasenaTemporal ?? d?.password ?? '');
        Swal.fire({
          ...BASE, icon: 'success', title: 'Contraseña Temporal',
          html: `Entrégala a <strong>${nombre}</strong>. Solo se muestra esta vez:<br><br>
            <code style="font-size:22px;letter-spacing:.08em;color:#ffc94d">${temp}</code>`,
          confirmButtonText: 'Copiar y Cerrar',
        }).then(() => navigator.clipboard?.writeText(temp));
      },
      error: (e) => this.error(e, 'No se pudo reiniciar la contraseña.'),
    });
  }

  /** §13.2: teléfono perdido. */
  async reiniciarSegundoFactor(u: any) {
    if (!this.rolAcceso.validar('gestionarUsuarios')) return;
    const nombre = this.nombreUsuario(u);
    if (!(await this.confirmar('¡Reiniciar Segundo Factor!', `<strong>${nombre}</strong> tendrá que volver a vincular su app autenticadora en su próximo acceso.`, 'Reiniciar'))) return;
    this.usuarios.reiniciarSegundoFactor(this.idUsuario(u)).subscribe({
      next: () => Swal.fire({ ...BASE, icon: 'success', title: '¡Segundo Factor Reiniciado!' }),
      error: (e) => this.error(e, 'No se pudo reiniciar el segundo factor.'),
    });
  }

  /** §13.4: interruptor "Exigir PIN" de la sala (Gerente). */
  async cambiarExigePin(sala: any): Promise<boolean | null> {
    if (!this.rolAcceso.validar('exigirPinSala')) return null;
    const actual = Number(sala?.exigePin ?? 1) === 1;
    const nuevo = !actual;
    const ok = await this.confirmar(
      nuevo ? '¡Exigir PIN!' : '¡Dejar de Exigir PIN!',
      nuevo
        ? 'Descarga, traspaso, canje y reemplazo pedirán el PIN del monedero.'
        : 'Descarga, traspaso, canje y reemplazo <strong>ya no</strong> pedirán el PIN del monedero.',
      'Confirmar'
    );
    if (!ok) return null;
    return new Promise((resolve) => {
      this.salas.actualizarExigePin(Number(sala.id), nuevo).subscribe({
        next: () => {
          sala.exigePin = nuevo ? 1 : 0;
          this.pinSala.limpiar();
          Swal.fire({ ...BASE, icon: 'success', title: nuevo ? 'La Sala Exige PIN' : 'La Sala ya no Exige PIN' });
          resolve(nuevo);
        },
        error: (e) => { this.error(e, 'No se pudo cambiar la configuración.'); resolve(null); },
      });
    });
  }

  /** §10: código de enrolamiento del RB (Técnico y Gerente). */
  async enrolarRb(maquina: any) {
    if (!this.rolAcceso.validar('enrolarRb')) return;
    const nombre = maquina?.numeroSerie || maquina?.nombre || maquina?.codigo || `Máquina #${maquina?.id}`;
    this.maquinas.generarCodigoEnrolamientoRb(Number(maquina.id)).subscribe({
      next: (r: any) => {
        const d = r?.data ?? r;
        const vence = d?.venceEn ? new Date(d.venceEn) : null;
        Swal.fire({
          ...BASE, icon: 'info', title: 'Código de Enrolamiento',
          html: `<p style="color:#ccc">Captúralo en el RB de <strong>${nombre}</strong>. Sirve una sola vez.</p>
            <div style="font-size:40px;font-weight:800;letter-spacing:.12em;color:#ffc94d;margin:12px 0">${d?.codigo ?? ''}</div>
            ${vence ? `<small style="color:#9ca3af">Vence: ${vence.toLocaleString('es-MX')}</small>` : ''}`,
          confirmButtonText: 'Listo',
        });
      },
      error: (e) => this.error(e, 'No se pudo generar el código.'),
    });
  }

  /** §10: desconecta el RB de la máquina. */
  async revocarRb(maquina: any) {
    if (!this.rolAcceso.validar('enrolarRb')) return;
    if (!(await this.confirmar('¡Revocar RB!', 'El RB quedará desconectado de esta máquina.', 'Revocar'))) return;
    this.maquinas.revocarRb(Number(maquina.id)).subscribe({
      next: (r: any) => Swal.fire({ ...BASE, icon: 'success', title: '¡RB Revocado!', text: `Credenciales revocadas: ${(r?.data ?? r)?.revocados ?? 0}` }),
      error: (e) => this.error(e, 'No se pudo revocar el RB.'),
    });
  }

  /** §13.7: lee el QR del teléfono (lector 2D que escribe como teclado) y devuelve el idMonedero. */
  leerQrMonedero(): Promise<number | null> {
    return Swal.fire({
      ...BASE, title: 'Leer QR del Teléfono',
      html: '<p style="color:#ccc;margin:0">Apunta el lector al QR de la app del afiliado o pega el código.</p>',
      input: 'text', inputPlaceholder: 'Código QR', inputAttributes: { autocomplete: 'off' },
      showCancelButton: true, confirmButtonText: 'Buscar', cancelButtonText: 'Cancelar',
      inputValidator: (v) => (!v?.trim() ? 'Lee o pega el código.' : null),
      showLoaderOnConfirm: true,
      preConfirm: (codigo: string) => new Promise((resolve) => {
        this.monederos.resolverQrDigital(codigo.trim()).subscribe({
          next: (r: any) => resolve(Number((r?.data ?? r)?.idMonedero)),
          error: (e) => { Swal.showValidationMessage(mensajeError(e, 'No se pudo leer el QR.')); resolve(false); },
        });
      }),
    }).then((r) => (r.isConfirmed && r.value ? Number(r.value) : null));
  }

  /** Perfil (§13.2): estado del segundo factor, regenerar códigos y desactivar si no es obligatorio. */
  gestionarSegundoFactorPerfil(irAlta: () => void) {
    this.segundoFactor.estado().subscribe({
      next: async (r: any) => {
        const st = r?.data ?? r;
        const desde = st?.desde ? new Date(st.desde).toLocaleDateString('es-MX') : '';
        const res = await Swal.fire({
          ...BASE, title: 'Segundo Factor',
          html: st?.activo
            ? `<p style="color:#34d399"><i class="fas fa-shield-alt"></i> Activo ${desde ? 'desde ' + desde : ''}</p>
               <p style="color:#ccc">Códigos de respaldo restantes: <strong>${st.codigosRespaldoRestantes ?? 0}</strong></p>`
            : `<p style="color:#ffc94d">No está activo.</p><p style="color:#ccc">${st?.obligatorio ? 'Tu rol lo requiere.' : 'Es opcional para tu rol.'}</p>`,
          showDenyButton: !!st?.activo && !st?.obligatorio,
          showCancelButton: true,
          confirmButtonText: st?.activo ? 'Regenerar Códigos' : 'Activar',
          denyButtonText: 'Desactivar',
          cancelButtonText: 'Cerrar',
        });
        if (res.isConfirmed && !st?.activo) { irAlta(); return; }
        if (res.isConfirmed) this.regenerarCodigos();
        if (res.isDenied) this.desactivarSegundoFactor();
      },
      error: (e) => this.error(e, 'No se pudo consultar el segundo factor.'),
    });
  }

  private async regenerarCodigos() {
    const r = await Swal.fire({ ...BASE, title: 'Regenerar Códigos', text: 'Captura el código de 6 dígitos de tu app. Los códigos anteriores dejarán de servir.', input: 'text', inputAttributes: { inputmode: 'numeric', maxlength: '6' }, showCancelButton: true, confirmButtonText: 'Regenerar', cancelButtonText: 'Cancelar', inputValidator: (v) => (/^\d{6}$/.test(v) ? null : 'Código de 6 dígitos.') });
    if (!r.isConfirmed) return;
    this.segundoFactor.regenerarCodigos(r.value).subscribe({
      next: (x: any) => {
        const codigos: string[] = (x?.data ?? x)?.codigosRespaldo ?? (Array.isArray(x) ? x : []);
        Swal.fire({ ...BASE, icon: 'success', title: 'Códigos Nuevos', html: `<p style="color:#ccc">Guárdalos: solo se muestran esta vez.</p><pre style="color:#ffc94d;font-size:16px;text-align:left;display:inline-block">${codigos.join('\n')}</pre>`, confirmButtonText: 'Copiar y Cerrar' })
          .then(() => navigator.clipboard?.writeText(codigos.join('\n')));
      },
      error: (e) => this.error(e, 'No se pudieron regenerar los códigos.'),
    });
  }

  private async desactivarSegundoFactor() {
    const r = await Swal.fire({
      ...BASE, title: 'Desactivar Segundo Factor',
      html: '<input id="sfPass" type="password" class="swal2-input" placeholder="Tu contraseña"><input id="sfCod" class="swal2-input" inputmode="numeric" maxlength="6" placeholder="Código de 6 dígitos">',
      showCancelButton: true, confirmButtonText: 'Desactivar', cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const password = (document.getElementById('sfPass') as HTMLInputElement).value;
        const codigo = (document.getElementById('sfCod') as HTMLInputElement).value;
        if (!password || !/^\d{6}$/.test(codigo)) { Swal.showValidationMessage('Captura tu contraseña y el código.'); return false; }
        return { password, codigo };
      },
    });
    if (!r.isConfirmed) return;
    this.segundoFactor.desactivar(r.value.password, r.value.codigo).subscribe({
      next: () => Swal.fire({ ...BASE, icon: 'success', title: 'Segundo Factor Desactivado' }),
      error: (e) => this.error(e, 'No se pudo desactivar.'),
    });
  }
}
