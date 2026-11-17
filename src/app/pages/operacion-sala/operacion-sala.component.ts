import { Component, OnDestroy, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { DashboardSala, OperacionSalaService } from 'src/app/shared/services/operacion-sala.service';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { mensajeError } from 'src/app/shared/utils/api-error';

/** Dashboard de sala (GET /dashboard/sala) y cierre manual de sesiones (ESPECIFICACION_FRONT §10). */
@Component({
  selector: 'app-operacion-sala',
  templateUrl: './operacion-sala.component.html',
  styleUrls: ['./operacion-sala.component.scss'],
})
export class OperacionSalaComponent implements OnInit, OnDestroy {
  data: DashboardSala | null = null;
  cargando = false;
  error: string | null = null;
  actualizado: Date | null = null;
  private timer: any;

  constructor(private api: OperacionSalaService, public rolAcceso: RolAccesoService) { }

  get puedeCerrar(): boolean { return this.rolAcceso.puede('cierreManualSesion'); }

  ngOnInit(): void {
    if (!this.rolAcceso.validar('verDashboardSala')) return;
    this.cargar();
    this.timer = setInterval(() => this.cargar(true), 60000);
  }

  ngOnDestroy(): void { clearInterval(this.timer); }

  cargar(silencioso = false): void {
    if (!silencioso) this.cargando = true;
    this.api.obtenerDashboardSala().subscribe({
      next: (r: any) => { this.data = r?.data ?? r; this.error = null; this.cargando = false; this.actualizado = new Date(); },
      error: (e) => { this.error = mensajeError(e, 'No se pudo cargar el tablero de sala.'); this.cargando = false; },
    });
  }

  /** Los montos vienen en centavos. */
  pesos(c: number | null | undefined): string {
    return ((Number(c) || 0) / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  get totalOperando(): number {
    const d = this.data;
    return d ? (d.efectivoEnCajasCentavos || 0) + (d.efectivoEnTesoreriaCentavos || 0) + (d.retenidoEnMaquinasCentavos || 0) : 0;
  }

  get descuadres(): number {
    const d = this.data;
    if (!d) return 0;
    return (d.turnosAbiertos || []).filter((t) => !t.cuadra).length + (d.tesorerias || []).filter((t) => !t.cuadra).length;
  }

  cierreManual(s: any): void {
    if (!this.rolAcceso.validar('cierreManualSesion')) return;
    Swal.fire({
      title: `Cierre Manual · ${s.maquina || 'Máquina #' + s.idMaquina}`,
      html: `
        <p style="color:#ccc;font-size:14px">Sesión #${s.idSesion} · ${s.estado}. Captura el crédito que verificaste físicamente en la máquina.</p>
        <input id="cmMonto" class="swal2-input" type="number" min="0" step="0.01" placeholder="Monto retirado (pesos)">
        <textarea id="cmMotivo" class="swal2-textarea" maxlength="500" placeholder="Motivo del cierre"></textarea>`,
      background: '#0d121d', confirmButtonColor: '#e40041', showCancelButton: true,
      confirmButtonText: 'Cerrar Sesión', cancelButtonText: 'Cancelar', showLoaderOnConfirm: true,
      preConfirm: () => {
        const monto = Number((document.getElementById('cmMonto') as HTMLInputElement).value);
        const motivo = (document.getElementById('cmMotivo') as HTMLTextAreaElement).value.trim();
        if (!(monto >= 0) || !/^\d+(\.\d{1,2})?$/.test(String(monto)) || motivo.length < 5) {
          Swal.showValidationMessage('Captura un monto válido (2 decimales) y un motivo de al menos 5 caracteres.');
          return false;
        }
        return new Promise((resolve) => {
          this.api.cierreManualSesion(Number(s.idSesion), { motivo, montoRetiradoCentavos: Math.round(monto * 100) }).subscribe({
            next: () => resolve(true),
            error: (e) => { Swal.showValidationMessage(mensajeError(e, 'No se pudo cerrar la sesión.')); resolve(false); },
          });
        });
      },
    }).then((r) => {
      if (r.isConfirmed && r.value) {
        Swal.fire({ title: '¡Sesión Cerrada!', icon: 'success', background: '#0d121d', confirmButtonColor: '#3085d6' });
        this.cargar(true);
      }
    });
  }
}
