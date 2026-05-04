import { animate, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import Swal from 'sweetalert2';
import {
  aplicarMontoBlurEnCampo,
  aplicarMontoInputEnCampo,
  textoMontoDesdeValorControl,
} from 'src/app/shared/utils/monto-input-formato.util';

/** Pestañas del panel Centro de Operaciones (mismo patrón que Promociones). */
export type TabAccionesBoveda = 'apertura' | 'efectivo';

const promoTabPanelAnimation = trigger('promoTabPanel', [
  transition('* => *', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('260ms cubic-bezier(0.33, 1, 0.68, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

@Component({
  selector: 'app-lista-tesoreria',
  templateUrl: './lista-tesoreria.component.html',
  styleUrl: './lista-tesoreria.component.scss',
  animations: [fadeInRightAnimation, promoTabPanelAnimation],
})
export class ListaTesoreriaComponent {
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaTesoreria: any;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public showExportGrid: boolean;
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

  /** Pestaña visible del panel de acciones rápidas. */
  tabAcciones: TabAccionesBoveda = 'apertura';

  @ViewChild('modalResumen', { static: false }) modalResumen!: TemplateRef<any>;
  @ViewChild('modalHistorial', { static: false }) modalHistorial!: TemplateRef<any>;
  @ViewChild('modalCerrarTesoreria', { static: false }) modalCerrarTesoreria!: TemplateRef<any>;
  @ViewChild('modalReponerTesoreria', { static: false }) modalReponerTesoreria!: TemplateRef<any>;
  @ViewChild('modalRetirarTesoreria', { static: false }) modalRetirarTesoreria!: TemplateRef<any>;

  @ViewChild('inpFondoContadoCerrar', { static: false }) inpFondoContadoCerrar?: ElementRef<HTMLInputElement>;
  @ViewChild('inpMontoReponer', { static: false }) inpMontoReponer?: ElementRef<HTMLInputElement>;
  @ViewChild('inpMontoRetirar', { static: false }) inpMontoRetirar?: ElementRef<HTMLInputElement>;
  
  public resumenData: any = null;
  public historialData: any[] = [];
  private modalRef?: NgbModalRef;

  // Formulario para cerrar tesorería
  cerrarTesoreriaForm: FormGroup;
  public listaTesoreriaAbierta: any[] = [];

  // Formulario para reponer tesorería
  reponerTesoreriaForm: FormGroup;
  public listaTesoreriaReponer: any[] = [];

  // Formulario para retirar tesorería
  retirarTesoreriaForm: FormGroup;
  public listaTesoreriaRetirar: any[] = [];

  loadingAcciones = false;

  constructor(
    private router: Router,
    private tesoreriaService: TesoreriaService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private rolAcceso: RolAccesoService,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
    this.cerrarTesoreriaForm = this.fb.group({
      idTesoreria: [null, Validators.required],
      fondoContado: [null as number | null, [Validators.required, Validators.min(0.01)]],
      observaciones: ['']
    });
    this.reponerTesoreriaForm = this.fb.group({
      idTesoreria: [null, Validators.required],
      monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
      referencia: [''],
      observaciones: ['']
    });
    this.retirarTesoreriaForm = this.fb.group({
      idTesoreria: [null, Validators.required],
      monto: [null as number | null, [Validators.required, Validators.min(0.01)]],
      referencia: [''],
      observaciones: ['']
    });
  }

  onMontoCerrarInput(ev: Event): void {
    aplicarMontoInputEnCampo(ev.target as HTMLInputElement, this.cerrarTesoreriaForm.get('fondoContado'));
  }

  onMontoCerrarBlur(ev: Event): void {
    aplicarMontoBlurEnCampo(ev.target as HTMLInputElement, this.cerrarTesoreriaForm.get('fondoContado'));
  }

  onMontoReponerInput(ev: Event): void {
    aplicarMontoInputEnCampo(ev.target as HTMLInputElement, this.reponerTesoreriaForm.get('monto'));
  }

  onMontoReponerBlur(ev: Event): void {
    aplicarMontoBlurEnCampo(ev.target as HTMLInputElement, this.reponerTesoreriaForm.get('monto'));
  }

  onMontoRetirarInput(ev: Event): void {
    aplicarMontoInputEnCampo(ev.target as HTMLInputElement, this.retirarTesoreriaForm.get('monto'));
  }

  onMontoRetirarBlur(ev: Event): void {
    aplicarMontoBlurEnCampo(ev.target as HTMLInputElement, this.retirarTesoreriaForm.get('monto'));
  }

  private refrescarVistasMontosModalesBoveda(): void {
    const sync = (ref: ElementRef<HTMLInputElement> | undefined, form: FormGroup, key: string) => {
      const el = ref?.nativeElement;
      if (!el) {
        return;
      }
      el.value = textoMontoDesdeValorControl(form.get(key)?.value);
    };
    sync(this.inpFondoContadoCerrar, this.cerrarTesoreriaForm, 'fondoContado');
    sync(this.inpMontoReponer, this.reponerTesoreriaForm, 'monto');
    sync(this.inpMontoRetirar, this.retirarTesoreriaForm, 'monto');
  }

  private despuesDeAbrirModalBoveda(): void {
    setTimeout(() => this.refrescarVistasMontosModalesBoveda(), 50);
  }

  ngOnInit() {
    this.setupDataSource();
  }

  setTabAcciones(tab: TabAccionesBoveda): void {
    this.tabAcciones = tab;
  }

  esTabAcciones(tab: TabAccionesBoveda): boolean {
    return this.tabAcciones === tab;
  }

  agregar() {
    this.router.navigateByUrl('/tesoreria/agregar-tesoreria');
  }

  actualizarTesoreria(id: Number) {
    this.router.navigateByUrl('/tesoreria/editar-tesoreria/' + id);
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Sin registro';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Sin registro';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return 'Sin registro';
    }
  }

  formatearFechaHora(fecha: string | null): string {
    if (!fecha) return 'Sin registro';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Sin registro';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return 'Sin registro';
    }
  }

  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return 'Sin registro';
    return `$${Number(valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /** Texto seguro para usar dentro de `html` en SweetAlert2. */
  private escapeHtml(texto: string): string {
    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  verResumen(id: number) {
    this.tesoreriaService.obtenerResumenCompletoTesoreria(id).subscribe({
      next: (response: any) => {
        this.resumenData = response.data || response;
        this.modalRef = this.modalService.open(this.modalResumen, {
          size: 'lg',
          windowClass: 'modal-holder modal-resumen',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo obtener el resumen.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  cerrarResumen() {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  verHistorial(id: number) {
    this.tesoreriaService.obtenerHistorialMovimientosTesoreria(id).subscribe({
      next: (response: any) => {
        this.historialData = response.data || response || [];
        this.modalRef = this.modalService.open(this.modalHistorial, {
          size: 'lg',
          windowClass: 'modal-holder modal-historial',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo obtener el historial.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  cerrarHistorial() {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  verSaldo(id: number) {
    this.tesoreriaService.obtenerSaldoTesoreria(id).subscribe({
      next: (response: any) => {
        const data = response?.data ?? response;
        const saldo = data?.saldo ?? data?.monto ?? data;
        const saldoNum = typeof saldo === 'number' ? saldo : Number(saldo);
        const saldoFormateado = isNaN(saldoNum) ? (typeof saldo === 'string' ? saldo : 'N/A') : this.formatearMoneda(saldoNum);
        Swal.fire({
          title: 'Saldo de Bóveda',
          html: `<p class="mb-0">Saldo: <strong>${saldoFormateado}</strong></p>`,
          icon: 'info',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Cerrar',
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo obtener el saldo de tesorería.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Cerrar',
        });
      }
    });
  }

  getIconoMovimiento(tipo: string): { class: string, icon: string } {
    const tipoLower = (tipo || '').toLowerCase();
    if (tipoLower.includes('retir')) {
      return { class: 'icon-retiro', icon: 'fa-arrow-down' };
    } else if (tipoLower.includes('repon')) {
      return { class: 'icon-reposicion', icon: 'fa-arrow-up' };
    } else if (tipoLower.includes('apertura') || tipoLower.includes('abrir')) {
      return { class: 'icon-apertura', icon: 'fa-door-open' };
    } else if (tipoLower.includes('dotación') || tipoLower.includes('dotacion')) {
      return { class: 'icon-dotacion', icon: 'fa-hand-holding-usd' };
    } else if (tipoLower.includes('devolucion')) {
      return { class: 'icon-devolucion', icon: 'fa-undo' };
    } else if (tipoLower.includes('cierre') || tipoLower.includes('cerrar')) {
      return { class: 'icon-cierre', icon: 'fa-door-closed' };
    }
    return { class: 'icon-otro', icon: 'fa-exchange-alt' };
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar este registro de tesorería?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.tesoreriaService.updateEstatus(rowData.id, 1).subscribe({
          next: (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El registro ha sido activado.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            if (this.dataGrid && this.dataGrid.instance) {
              this.dataGrid.instance.refresh();
            }
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error.error || 'No se pudo activar el registro de tesorería.',
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        });
      }
    });
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: '¡Desactivar!',
      html: `¿Está seguro que requiere desactivar este registro de tesorería?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.tesoreriaService.updateEstatus(rowData.id, 0).subscribe({
          next: (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El registro ha sido desactivado.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            if (this.dataGrid && this.dataGrid.instance) {
              this.dataGrid.instance.refresh();
            }
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error.error || 'No se pudo desactivar el registro de tesorería.',
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        });
      }
    });
  }

  /** GET tesorerias/abierta/creada/sala/{idSala} - Ver bóveda abierta de la sala */
  verBovedaAbiertaSala(rowData: any) {
    const idSala = rowData.idSala ?? rowData.id_sala ?? rowData.sala?.id;
    if (!idSala) {
      Swal.fire({
        title: '¡Atención!',
        text: 'No se encontró el ID de la sala para consultar.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    this.tesoreriaService.obtenerTesoreriaAbiertaPorSala(Number(idSala)).subscribe({
      next: (response: any) => {
        const rawData =
          response != null && Object.prototype.hasOwnProperty.call(response, 'data')
            ? response.data
            : response;
        const tieneListaVacia = Array.isArray(rawData) && rawData.length === 0;
        const sinRegistro =
          rawData === null ||
          rawData === undefined ||
          tieneListaVacia;

        if (sinRegistro) {
          const mensajeApi =
            typeof response?.message === 'string' && response.message.trim()
              ? response.message.trim()
              : 'No hay tesorería abierta para esta sala.';
          const nombreSala =
            rowData?.nombreSala ??
            rowData?.nombreComercialSala ??
            rowData?.nombreComercial ??
            '';
          const bloqueSala = nombreSala
            ? `<p class="mb-2" style="color:#94a3b8;font-size:13px"><strong>Sala:</strong> ${this.escapeHtml(
                String(nombreSala)
              )}</p>`
            : '';
          Swal.fire({
            title: 'Sin bóveda abierta',
            html:
              `${bloqueSala}` +
              `<p class="mb-0" style="color:#e2e8f0;line-height:1.45">${this.escapeHtml(mensajeApi)}</p>`,
            icon: 'info',
            background: '#0d121d',
            color: '#e2e8f0',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Entendido',
          });
          return;
        }

        const t = Array.isArray(rawData) ? rawData[0] : rawData;
        const sala =
          t?.nombreSala ?? t?.nombreComercialSala ?? rowData?.nombreSala ?? rowData?.nombreComercialSala ?? 'Sala';
        const fondo =
          t?.fondoInicial != null && t?.fondoInicial !== ''
            ? this.formatearMoneda(t.fondoInicial)
            : 'Sin registro';
        const estatus =
          t?.nombreEstatusTesoreria ?? t?.codigoEstatusTesoreria ?? 'Sin registro';
        Swal.fire({
          title: 'Bóveda abierta',
          html: `
            <p class="mb-1" style="color:#e2e8f0"><strong>Sala:</strong> ${this.escapeHtml(String(sala))}</p>
            <p class="mb-1" style="color:#e2e8f0"><strong>Fondo inicial:</strong> ${this.escapeHtml(String(fondo))}</p>
            <p class="mb-0" style="color:#e2e8f0"><strong>Estatus:</strong> ${this.escapeHtml(String(estatus))}</p>
          `,
          icon: 'success',
          background: '#0d121d',
          color: '#e2e8f0',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Cerrar',
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo obtener la bóveda abierta de la sala.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  /** DELETE /tesorerias/{id} — identificador de la tesorería (Swagger). */
  eliminarTesoreria(idTesoreriaRaw: number | string | null | undefined) {
    const idTesoreria = Math.trunc(Number(idTesoreriaRaw));
    if (!Number.isFinite(idTesoreria) || idTesoreria <= 0) {
      Swal.fire({
        title: '¡Atención!',
        text: 'No se pudo obtener el identificador de la tesorería para eliminar.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return;
    }
    Swal.fire({
      title: '¿Eliminar tesorería?',
      html: `¿Está seguro que desea eliminar este registro de tesorería? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.tesoreriaService.eliminarTesoreria(idTesoreria).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El registro de tesorería ha sido eliminado.',
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            if (this.dataGrid && this.dataGrid.instance) {
              this.dataGrid.instance.refresh();
            }
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error?.error?.message || error?.error || 'No se pudo eliminar el registro de tesorería.',
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        });
      }
    });
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  setupDataSource() {
    this.loading = true;

    this.listaTesoreria = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 20;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.tesoreriaService.obtenerTesoreriaData(page, take)
          );
          this.loading = false;
          const rows: any[] = Array.isArray(resp?.data) ? resp.data : [];
          const meta = resp?.paginated || {};
          const totalRegistros =
            toNum(meta.total) ??
            toNum(resp?.total) ??
            rows.length;

          const paginaActual =
            toNum(meta.page) ??
            toNum(resp?.page) ??
            page;

          const totalPaginas =
            toNum(meta.lastPage) ??
            toNum(resp?.pages) ??
            Math.max(1, Math.ceil(totalRegistros / take));

          const dataTransformada = rows.map((item: any) => {
            // Función auxiliar para mostrar "Sin registro" si es null
            const sinRegistro = (value: any): string => {
              return value !== null && value !== undefined && value !== '' ? value : 'Sin registro';
            };

            // Concatenar nombre completo del cliente
            const nombreCompletoCliente = [
              item?.nombreCliente,
              item?.apellidoPaternoCliente,
              item?.apellidoMaternoCliente
            ].filter(Boolean).join(' ').trim() || 'Sin registro';

            // Concatenar nombre completo del usuario de apertura
            const nombreCompletoUsuarioApertura = [
              item?.nombreUsuarioApertura,
              item?.apellidoPaternoUsuarioApertura,
              item?.apellidoMaternoUsuarioApertura
            ].filter(Boolean).join(' ').trim() || 'Sin registro';

            // Concatenar nombre completo del usuario de cierre
            const nombreCompletoUsuarioCierre = [
              item?.nombreUsuarioCierre,
              item?.apellidoPaternoUsuarioCierre,
              item?.apellidoMaternoUsuarioCierre
            ].filter(Boolean).join(' ').trim() || 'Sin registro';

            // Formatear estatus con badge
            const estatusTexto = item?.estatus === 1 ? 'Activo' : item?.estatus === 0 ? 'Inactivo' : 'Sin registro';
            const estatusBadge = item?.estatus === 1 
              ? '<span class="badge bg-success">Activo</span>' 
              : item?.estatus === 0 
                ? '<span class="badge bg-danger">Inactivo</span>' 
                : '<span class="badge bg-secondary">Sin registro</span>';

            // Badge para estatus tesorería - usando el estilo de estatus de administración
            const estatusTesoreriaTexto = item?.nombreEstatusTesoreria || 'Sin registro';
            const estatusTesoreriaColor = item?.colorEstatusTesoreria || '#6c757d';

            // Formatear fechas
            const formatearFecha = (fecha: string | null): string => {
              if (!fecha) return 'Sin registro';
              try {
                const d = new Date(fecha);
                if (isNaN(d.getTime())) return 'Sin registro';
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yyyy = d.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
              } catch {
                return 'Sin registro';
              }
            };

            const formatearFechaHora = (fecha: string | null): string => {
              if (!fecha) return 'Sin registro';
              try {
                const d = new Date(fecha);
                if (isNaN(d.getTime())) return 'Sin registro';
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const yyyy = d.getFullYear();
                const hh = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
              } catch {
                return 'Sin registro';
              }
            };

            const idFila =
              item?.id != null
                ? Number(item.id)
                : item?.Id != null
                  ? Number(item.Id)
                  : NaN;
            const idNormalizado =
              Number.isFinite(idFila) && idFila > 0 ? Math.trunc(idFila) : undefined;

            return {
              ...item,
              ...(idNormalizado !== undefined ? { id: idNormalizado } : {}),
              estatusTexto,
              estatusBadge,
              estatusTesoreriaTexto,
              estatusTesoreriaColor,
              nombreCompletoCliente,
              nombreCompletoUsuarioApertura,
              nombreCompletoUsuarioCierre,
              fechaFormateada: formatearFecha(item?.fecha),
              fechaAperturaFormateada: formatearFechaHora(item?.fechaApertura),
              fechaCierreFormateada: formatearFechaHora(item?.fechaCierre),
              fondoInicialFormateado: item?.fondoInicial !== null && item?.fondoInicial !== undefined 
                ? `$${Number(item.fondoInicial).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : 'Sin registro',
              fondoContadoFormateado: item?.fondoContado !== null && item?.fondoContado !== undefined 
                ? `$${Number(item.fondoContado).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : 'Sin registro',
              nombreSala: sinRegistro(item?.nombreSala),
              nombreComercialSala: sinRegistro(item?.nombreComercialSala),
              rfcCliente: sinRegistro(item?.rfcCliente),
              codigoEstatusTesoreria: sinRegistro(item?.codigoEstatusTesoreria),
              observaciones: sinRegistro(item?.observaciones)
            };
          });

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = dataTransformada;

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (err) {
          this.loading = false;
          console.error('Error en la solicitud de datos:', err);
          return { data: [], totalCount: 0 };
        }
      }
    });

    function toNum(v: any): number | null {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  }

  onGridOptionChanged(e: any) {
    if (e.fullName !== 'searchPanel.text') return;

    const grid = this.dataGrid?.instance;
    const texto = (e.value ?? '').toString().trim().toLowerCase();
    if (!texto) {
      this.filtroActivo = '';
      grid?.option('dataSource', this.listaTesoreria);
      return;
    }
    this.filtroActivo = texto;
    let columnas: any[] = [];
    try {
      const colsOpt = grid?.option('columns');
      if (Array.isArray(colsOpt) && colsOpt.length) columnas = colsOpt;
    } catch { }
    if (!columnas.length && grid?.getVisibleColumns) {
      columnas = grid.getVisibleColumns();
    }
    const dataFields: string[] = columnas
      .map((c: any) => c?.dataField)
      .filter((df: any) => typeof df === 'string' && df.trim().length > 0);
    const normalizar = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (val instanceof Date) {
        const dd = String(val.getDate()).padStart(2, '0');
        const mm = String(val.getMonth() + 1).padStart(2, '0');
        const yyyy = val.getFullYear();
        return `${dd}/${mm}/${yyyy}`.toLowerCase();
      }
      return String(val).toLowerCase();
    };
    const dataFiltrada = (this.paginaActualData || []).filter((row: any) => {
      const hitEnColumnas = dataFields.some((df) => normalizar(row?.[df]).includes(texto));
      const extras = [
        normalizar(row?.id),
        normalizar(row?.estatusTexto),
        normalizar(row?.nombreCompletoCliente),
        normalizar(row?.nombreCompletoUsuarioApertura),
        normalizar(row?.nombreCompletoUsuarioCierre)
      ];

      return hitEnColumnas || extras.some((s) => s.includes(texto));
    });
    grid?.option('dataSource', dataFiltrada);
  }

  toggleExpandGroups() {
    const groupedColumns = this.dataGrid.instance
      .getVisibleColumns()
      .filter((col) => col.groupIndex >= 0);
    if (groupedColumns.length === 0) {
      Swal.fire({
        title: '¡Ops!',
        text: 'Debes arrastrar un encabezado de una columna para expandir o contraer grupos.',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
        allowOutsideClick: false,
        background: '#0d121d'
      });
    } else {
      this.autoExpandAllGroups = !this.autoExpandAllGroups;
      this.dataGrid.instance.refresh();
    }
  }

  limpiarCampos() {
    this.dataGrid.instance.clearGrouping();
    this.dataGrid.instance.pageIndex(0);
    this.dataGrid.instance.refresh();
    this.isGrouped = false;
  }

  abrirTesoreria() {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('abrirTesoreriaDelDia', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('abrirTesoreriaDelDia');
      return;
    }
    this.router.navigate(['/tesoreria/abrir-boveda']);
  }

  private soloBovedasAbiertas(data: any[]): any[] {
    return (data || []).filter((t: any) => {
      const c = (t.codigoEstatusTesoreria || '').toString().toUpperCase();
      return c === 'ABIERTA' || c === 'ABIERTO';
    });
  }

  private mapTesoreriaOption(t: any): any {
    return {
      ...t,
      id: Number(t.id),
      text: `${t.nombreSala || ''} - ${this.formatearFecha(t.fecha)}${t.fondoInicial != null ? ' - Fondo: ' + this.formatearMoneda(t.fondoInicial) : ''}`.trim()
    };
  }

  cerrarTesoreria() {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('cerrarTesoreriaDelDia', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('cerrarTesoreriaDelDia');
      return;
    }
    this.loadingAcciones = true;
    this.tesoreriaService.obtenerTesoreriaData(1, 100).subscribe({
      next: (response) => {
        this.loadingAcciones = false;
        const abiertas = this.soloBovedasAbiertas(response.data || []);
        this.listaTesoreriaAbierta = abiertas.map((t: any) => this.mapTesoreriaOption(t));

        if (this.listaTesoreriaAbierta.length === 0) {
          Swal.fire({
            title: '¡Atención!',
            text: 'No hay bovedas abiertas disponibles para cerrar.',
            icon: 'warning',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          return;
        }

        this.cerrarTesoreriaForm.reset({ idTesoreria: null, fondoContado: null, observaciones: '' });

        this.modalRef = this.modalService.open(this.modalCerrarTesoreria, {
          size: 'md',
          windowClass: 'modal-holder modal-accion',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
        this.despuesDeAbrirModalBoveda();
      },
      error: (error) => {
        this.loadingAcciones = false;
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las tesorerías disponibles.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarCerrarTesoreria() {
    if (this.cerrarTesoreriaForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Por favor complete todos los campos requeridos.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }

    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('cerrarTesoreriaDelDia', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('cerrarTesoreriaDelDia');
      return;
    }

    const payload = {
      idTesoreria: Number(this.cerrarTesoreriaForm.value.idTesoreria),
      fondoContado: Number(this.cerrarTesoreriaForm.value.fondoContado ?? 0),
      observaciones: (this.cerrarTesoreriaForm.value.observaciones || '').trim() || null
    };

    this.tesoreriaService.cerrarTesoreria(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha cerrado la tesorería de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.setupDataSource();
      },
      error: (error) => {
        const errBody = error?.error;
        const texto =
          typeof errBody === 'string'
            ? errBody
            : (errBody?.message ?? errBody?.Message ?? error?.message ?? 'No se pudo cerrar la tesorería.');
        Swal.fire({
          title: '¡Error!',
          text: texto,
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  reponerTesoreria() {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('cerrarTesoreriaDelDia', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('cerrarTesoreriaDelDia');
      return;
    }
    this.loadingAcciones = true;
    this.tesoreriaService.obtenerTesoreriaData(1, 100).subscribe({
      next: (response) => {
        this.loadingAcciones = false;
        const abiertas = this.soloBovedasAbiertas(response.data || []);
        this.listaTesoreriaReponer = abiertas.map((t: any) => this.mapTesoreriaOption(t));

        if (this.listaTesoreriaReponer.length === 0) {
          Swal.fire({
            title: '¡Atención!',
            text: 'No hay bovedas abiertas disponibles para reponer.',
            icon: 'warning',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          return;
        }

        this.reponerTesoreriaForm.reset({ idTesoreria: null, monto: null, referencia: '', observaciones: '' });

        this.modalRef = this.modalService.open(this.modalReponerTesoreria, {
          size: 'md',
          windowClass: 'modal-holder modal-accion',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
        this.despuesDeAbrirModalBoveda();
      },
      error: (error) => {
        this.loadingAcciones = false;
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las tesorerías disponibles.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarReponerTesoreria() {
    if (this.reponerTesoreriaForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Por favor complete todos los campos requeridos.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }

    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('cerrarTesoreriaDelDia', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('cerrarTesoreriaDelDia');
      return;
    }

    const payload = {
      idTesoreria: Number(this.reponerTesoreriaForm.value.idTesoreria),
      monto: Number(this.reponerTesoreriaForm.value.monto ?? 0),
      referencia: (this.reponerTesoreriaForm.value.referencia || '').trim() || null,
      observaciones: (this.reponerTesoreriaForm.value.observaciones || '').trim() || null
    };

    this.tesoreriaService.reponerTesoreria(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha repuesto efectivo a la tesorería de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.setupDataSource();
      },
      error: (error) => {
        const errBody = error?.error;
        const texto =
          typeof errBody === 'string'
            ? errBody
            : (errBody?.message ?? errBody?.Message ?? error?.message ?? 'No se pudo reponer el efectivo a la tesorería.');
        Swal.fire({
          title: '¡Error!',
          text: texto,
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  retirarTesoreria() {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('cerrarTesoreriaDelDia', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('cerrarTesoreriaDelDia');
      return;
    }
    this.loadingAcciones = true;
    this.tesoreriaService.obtenerTesoreriaData(1, 100).subscribe({
      next: (response) => {
        this.loadingAcciones = false;
        const abiertas = this.soloBovedasAbiertas(response.data || []);
        this.listaTesoreriaRetirar = abiertas.map((t: any) => this.mapTesoreriaOption(t));

        if (this.listaTesoreriaRetirar.length === 0) {
          Swal.fire({
            title: '¡Atención!',
            text: 'No hay bovedas abiertas disponibles para retirar.',
            icon: 'warning',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          return;
        }

        this.retirarTesoreriaForm.reset({ idTesoreria: null, monto: null, referencia: '', observaciones: '' });

        this.modalRef = this.modalService.open(this.modalRetirarTesoreria, {
          size: 'md',
          windowClass: 'modal-holder modal-accion',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
        this.despuesDeAbrirModalBoveda();
      },
      error: (error) => {
        this.loadingAcciones = false;
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las tesorerías disponibles.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarRetirarTesoreria() {
    if (this.retirarTesoreriaForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Por favor complete todos los campos requeridos.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }

    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('cerrarTesoreriaDelDia', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('cerrarTesoreriaDelDia');
      return;
    }

    const payload = {
      idTesoreria: Number(this.retirarTesoreriaForm.value.idTesoreria),
      monto: Number(this.retirarTesoreriaForm.value.monto ?? 0),
      referencia: (this.retirarTesoreriaForm.value.referencia || '').trim() || null,
      observaciones: (this.retirarTesoreriaForm.value.observaciones || '').trim() || null
    };

    this.tesoreriaService.retirarTesoreria(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha retirado efectivo de la tesorería de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.setupDataSource();
      },
      error: (error) => {
        const errBody = error?.error;
        const texto =
          typeof errBody === 'string'
            ? errBody
            : (errBody?.message ?? errBody?.Message ?? error?.message ?? 'No se pudo retirar el efectivo de la tesorería.');
        Swal.fire({
          title: '¡Error!',
          text: texto,
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  cerrarModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.cerrarTesoreriaForm.reset();
      this.reponerTesoreriaForm.reset();
      this.retirarTesoreriaForm.reset();
    }
  }
}
