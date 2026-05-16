import { animate, style, transition, trigger } from '@angular/animations';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { forkJoin, lastValueFrom, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { TurnosActivosDescargaMonederoService } from 'src/app/shared/services/turnos-activos-descarga-monedero.service';
import Swal from 'sweetalert2';
import {
  aplicarMontoBlurEnCampo,
  aplicarMontoInputEnCampo,
  textoMontoDesdeValorControl,
} from 'src/app/shared/utils/monto-input-formato.util';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';

/** Pestañas del panel Centro de Operaciones (mismo patrón que Promociones). */
export type TabAccionesMonederos = 'movimientos' | 'administracion';

const promoTabPanelAnimation = trigger('promoTabPanel', [
  transition('* => *', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('260ms cubic-bezier(0.33, 1, 0.68, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

@Component({
  selector: 'app-lista-monederos',
  templateUrl: './lista-monederos.component.html',
  styleUrl: './lista-monederos.component.scss',
  animations: [fadeInRightAnimation, promoTabPanelAnimation],
})
export class ListaMonederosComponent {
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaMonederos: any;
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
  public listaEstatusMonedero: any[] = [];
  /** Cuando es `true`, el grid solicita el listado completo (`?todos=true`) y muestra monederos en cualquier estatus. */
  public mostrarTodosEstatus: boolean = false;

  /** Pestaña visible del panel de acciones rápidas. */
  tabAcciones: TabAccionesMonederos = 'administracion';

  @ViewChild('modalCargarMonedero', { static: false }) modalCargarMonedero!: TemplateRef<any>;
  @ViewChild('modalDescargarMonedero', { static: false }) modalDescargarMonedero!: TemplateRef<any>;
  @ViewChild('modalConsultarSaldo', { static: false }) modalConsultarSaldo!: TemplateRef<any>;
  @ViewChild('modalCambiarEstatus', { static: false }) modalCambiarEstatus!: TemplateRef<any>;
  @ViewChild('modalTraspaso', { static: false }) modalTraspaso!: TemplateRef<any>;
  @ViewChild('modalMonederosPorAfiliado', { static: false }) modalMonederosPorAfiliado!: TemplateRef<any>;
  @ViewChild('modalReemplazarMonedero', { static: false }) modalReemplazarMonedero!: TemplateRef<any>;
  @ViewChild('modalAjusteMonedero', { static: false }) modalAjusteMonedero!: TemplateRef<any>;
  @ViewChild('modalHistorialMonedero', { static: false }) modalHistorialMonedero!: TemplateRef<any>;
  private modalRef?: NgbModalRef;

  public historialData: any[] = [];
  monederoSeleccionadoHistorial: { id?: number; numeroMonedero?: string; alias?: string } | null = null;

  // Formulario para cargar monedero
  cargarMonederoForm: FormGroup;
  public listaCajasCargar: any[] = [];
  public listaMonederosDisponibles: any[] = [];

  // Formulario para descargar monedero
  descargarMonederoForm: FormGroup;
  public listaCajasDescargar: any[] = [];
  public listaMonederosDisponiblesDescargar: any[] = [];

  // Formulario y datos para consultar saldo
  consultarSaldoForm: FormGroup;
  saldoData: any = null;
  consultandoSaldo = false;
  /** Lista de monederos para el select de «Consultar saldo» (`GET monederos/list`). */
  listaMonederosConsultaSaldo: { id?: number; numeroMonedero: string; text: string }[] = [];
  cargandoMonederosConsultaSaldo = false;
  /** Consulta directa desde la grilla: sin paso de selección en el modal. */
  cargandoConsultaSaldoFila = false;
  /** Si true, al ver resultados el pie izquierdo cierra el modal (no ofrece «Nueva consulta» con el formulario). */
  consultaSaldoDesdeAccionFila = false;
  private consultaSaldoFilaSub?: Subscription;

  // Formulario para cambiar estatus de monedero
  cambiarEstatusForm: FormGroup;
  public listaEstatusMonederoOpciones: { id: number; text: string }[] = [];
  monederoSeleccionadoCambio: { numeroMonedero?: string; alias?: string } | null = null;

  // Formulario para traspaso
  traspasoMonederoForm: FormGroup;
  public listaAfiliadosTraspaso: any[] = [];
  public listaCajasTraspaso: any[] = [];
  public listaMonederosTraspaso: any[] = [];

  // Formulario para monederos por afiliado
  monederosPorAfiliadoForm: FormGroup;
  public listaAfiliadosMonederos: any[] = [];
  public listaMonederosAfiliado: any[] = [];
  public cargandoMonederosAfiliado = false;

  // Formulario para reemplazar monedero
  reemplazarMonederoForm: FormGroup;
  monederoSeleccionadoReemplazar: { id?: number; numeroMonedero?: string; alias?: string } | null = null;

  // Formulario para ajuste de saldo (perfiles autorizados vía RolAccesoService)
  ajusteMonederoForm: FormGroup;
  public listaMonederosDisponiblesAjuste: any[] = [];
  public listaTipoSaldoAjuste: { id: number; text: string }[] = [];

  guardandoCargarMonedero = false;
  guardandoDescargarMonedero = false;
  guardandoCambiarEstatusMonedero = false;
  guardandoAjusteMonedero = false;
  guardandoReemplazarMonedero = false;
  guardandoTraspasoMonedero = false;
  abriendoModalDescargar = false;
  abriendoModalTraspaso = false;
  abriendoModalAjuste = false;
  abriendoModalMonederosAfiliado = false;
  cargandoHistorialMonederoId: number | null = null;

  constructor(
    private router: Router,
    private monederosService: MonederosServices,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private cajasService: CajasService,
    private turnosActivosDescargaMonedero: TurnosActivosDescargaMonederoService,
    private auth: AuthenticationService,
    private rolAcceso: RolAccesoService,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
    this.cargarMonederoForm = this.fb.group({
      idCaja: [null, Validators.required],
      idMonedero: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });
    this.descargarMonederoForm = this.fb.group({
      idCaja: [null, Validators.required],
      idMonedero: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });
    this.consultarSaldoForm = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(1)]]
    });
    this.cambiarEstatusForm = this.fb.group({
      idMonedero: [null, Validators.required],
      idEstatusMonedero: [null, Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(1)]]
    });
    this.traspasoMonederoForm = this.fb.group({
      idAfiliado: [null, Validators.required],
      idTurnoCaja: [null, Validators.required],
      idMonederoOrigen: [null, Validators.required],
      idMonederoDestino: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });
    this.monederosPorAfiliadoForm = this.fb.group({
      idAfiliado: [null, Validators.required]
    });
    this.reemplazarMonederoForm = this.fb.group({
      idMonederoAnterior: [null, Validators.required],
      numeroMonederoNuevo: ['', [Validators.required, Validators.minLength(1)]],
      motivo: ['', [Validators.required, Validators.minLength(1)]],
      transferirSaldo: [true]
    });
    this.ajusteMonederoForm = this.fb.group({
      idMonedero: [null, Validators.required],
      tipoAjuste: ['positivo', Validators.required],
      idTipoSaldo: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      justificacion: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit() {
    this.cargarEstatusMonedero();
    this.setupDataSource();
  }

  setTabAcciones(tab: TabAccionesMonederos): void {
    this.tabAcciones = tab;
  }

  esTabAcciones(tab: TabAccionesMonederos): boolean {
    return this.tabAcciones === tab;
  }

  /** Bloqueado y reemplazado no se ofrecen en el selector del modal de cambio de estatus. */
  private esEstatusExcluidoSelectorCambio(e: any): boolean {
    const codigo = String(e?.codigo ?? '').trim().toUpperCase();
    const nombre = String(e?.nombre ?? e?.nombreEstatusMonedero ?? '').trim().toUpperCase();
    const key = codigo || nombre;
    return key.includes('BLOQUEADO') || key.includes('REEMPLAZADO');
  }

  private esEstatusMonederoCanceladoPorId(idEstatusMonedero: number): boolean {
    const e = this.listaEstatusMonedero.find((x: any) => Number(x.id) === Number(idEstatusMonedero));
    if (!e) return false;
    const codigo = String(e?.codigo ?? '').trim().toUpperCase();
    const nombre = String(e?.nombre ?? e?.nombreEstatusMonedero ?? '').trim().toUpperCase();
    const key = codigo || nombre;
    return key.includes('CANCELADO');
  }

  cargarEstatusMonedero() {
    this.monederosService.obtenerEstatusMonedero().subscribe({
      next: (response) => {
        this.listaEstatusMonedero = response?.data || [];
        this.listaEstatusMonederoOpciones = this.listaEstatusMonedero
          .filter((e: any) => !this.esEstatusExcluidoSelectorCambio(e))
          .map((e: any) => ({
            id: Number(e.id),
            text: e.nombre || e.nombreEstatusMonedero || ''
          }));
      },
      error: (error) => {
        console.error('Error al cargar estatus monedero:', error);
      }
    });
  }

  agregar() {
    this.router.navigateByUrl('/monederos/agregar-monedero');
  }

  actualizarMonedero(id: Number) {
    this.router.navigateByUrl('/monederos/editar-monedero/' + id);
  }

  activar(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar este monedero "${rowData.numeroMonedero || rowData.alias}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.monederosService.updateEstatus(rowData.id, 1).subscribe({
          next: (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El monedero ha sido activado.`,
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
              text: error.error || 'No se pudo activar el monedero.',
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

  abrirCambiarEstatus(rowData: any) {
    this.monederoSeleccionadoCambio = {
      numeroMonedero: rowData.numeroMonedero,
      alias: rowData.alias
    };
    this.cambiarEstatusForm.patchValue({
      idMonedero: rowData.id,
      idEstatusMonedero: null,
      motivo: ''
    });
    this.modalRef = this.modalService.open(this.modalCambiarEstatus, {
      size: 'md',
      windowClass: 'modal-holder modal-cambiar-estatus',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
  }

  private mapearTiposSaldoAjuste(resp: any): { id: number; text: string }[] {
    const rows = Array.isArray(resp?.data) ? resp.data : [];
    return rows
      .filter((t: any) => {
        if (t == null) return false;
        if (t.estatus === undefined || t.estatus === null || t.estatus === '') return true;
        return Number(t.estatus) === 1;
      })
      .slice()
      .sort((a: any, b: any) => Number(a?.prioridadUso ?? 999) - Number(b?.prioridadUso ?? 999))
      .map((t: any) => ({
        id: Number(t.id),
        text: String(t.nombre ?? t.codigo ?? '').trim() || 'Tipo saldo'
      }))
      .filter((row: { id: number }) => Number.isFinite(row.id));
  }

  ajusteMonedero() {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('ajustarSaldoMonedero', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('ajustarSaldoMonedero');
      return;
    }
    this.abriendoModalAjuste = true;
    forkJoin({
      monederos: this.monederosService.obtenerMonederos(),
      tiposSaldo: this.monederosService.obtenerCatTiposSaldo()
    })
      .pipe(finalize(() => (this.abriendoModalAjuste = false)))
      .subscribe({
      next: (responses) => {
        this.listaTipoSaldoAjuste = this.mapearTiposSaldoAjuste(responses.tiposSaldo);
        if (this.listaTipoSaldoAjuste.length === 0) {
          Swal.fire({
            title: '¡Atención!',
            text: 'No hay tipos de saldo disponibles en el catálogo.',
            icon: 'warning',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
          return;
        }

        this.listaMonederosDisponiblesAjuste = (responses.monederos.data || []).map((m: any) => {
          const nombreCompletoAfiliado = `${m?.nombreAfiliado || ''} ${m?.apellidoPaternoAfiliado || ''} ${m?.apellidoMaternoAfiliado || ''}`.trim() || 'Sin afiliado';
          return {
            ...m,
            id: Number(m.id),
            nombreCompletoAfiliado,
            text: this.textoEtiquetaSelectMonedero(m)
          };
        });

        const firstTipo = this.listaTipoSaldoAjuste[0]?.id ?? null;

        this.ajusteMonederoForm.reset({
          idMonedero: null,
          tipoAjuste: 'positivo',
          idTipoSaldo: firstTipo,
          monto: '',
          justificacion: ''
        });
        this.modalRef = this.modalService.open(this.modalAjusteMonedero, {
          size: 'md',
          windowClass: 'modal-holder modal-ajuste-monedero',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text:
            error?.error?.message ||
            error?.error ||
            'No se pudieron cargar los datos para el ajuste de saldo.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarAjusteMonedero() {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('ajustarSaldoMonedero', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('ajustarSaldoMonedero');
      return;
    }
    if (this.ajusteMonederoForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Complete todos los campos requeridos.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    const payload = {
      idMonedero: Number(this.ajusteMonederoForm.value.idMonedero),
      tipoAjuste: this.ajusteMonederoForm.value.tipoAjuste as 'positivo' | 'negativo',
      idTipoSaldo: Number(this.ajusteMonederoForm.value.idTipoSaldo),
      monto: Number(this.ajusteMonederoForm.value.monto),
      justificacion: (this.ajusteMonederoForm.value.justificacion || '').trim()
    };
    this.guardandoAjusteMonedero = true;
    this.monederosService
      .ajusteMonedero(payload)
      .pipe(finalize(() => (this.guardandoAjusteMonedero = false)))
      .subscribe({
      next: () => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha realizado el ajuste de saldo correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        if (this.modalRef) this.modalRef.close();
        this.ajusteMonederoForm.reset();
        this.setupDataSource();
        if (this.dataGrid?.instance) this.dataGrid.instance.refresh();
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo realizar el ajuste.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  verHistorialMonedero(id: number, rowData?: any) {
    this.monederoSeleccionadoHistorial = rowData ? { id: rowData.id, numeroMonedero: rowData.numeroMonedero, alias: rowData.alias } : null;
    this.cargandoHistorialMonederoId = id;
    this.monederosService
      .obtenerHistorialMovimientosMonedero(id)
      .pipe(finalize(() => (this.cargandoHistorialMonederoId = null)))
      .subscribe({
      next: (response: any) => {
        const raw = response?.data !== undefined ? response.data : response;
        this.historialData = Array.isArray(raw) ? raw : Array.isArray(raw?.movimientos) ? raw.movimientos : [];
        this.modalRef = this.modalService.open(this.modalHistorialMonedero, {
          size: 'lg',
          windowClass: 'modal-holder modal-historial-movimientos',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo obtener el historial.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  cerrarHistorialMonedero() {
    if (this.modalRef) this.modalRef.close();
    this.historialData = [];
    this.monederoSeleccionadoHistorial = null;
  }

  /** Misma línea visual que el listado de afiliados (píldoras suaves por código CAT). */
  obtenerClaseEstatusMonedero(row: any): string {
    const codigo = String(row?.estatusMonederoCodigo ?? row?.codigoEstatusMonedero ?? '')
      .trim()
      .toUpperCase();
    const nombre = String(row?.nombreEstatusMonedero ?? row?.estatusMonederoTexto ?? '')
      .trim()
      .toUpperCase();
    const key = codigo || nombre;
    if (key.includes('ACTIVO')) return 'estatus-afiliado-pill--activo';
    if (key.includes('BLOQUEADO')) return 'estatus-afiliado-pill--bloqueado';
    if (key.includes('EXTRAVIADO')) return 'estatus-afiliado-pill--extraviado';
    if (key.includes('ROBADO')) return 'estatus-afiliado-pill--robado';
    if (key.includes('REEMPLAZADO')) return 'estatus-afiliado-pill--reemplazado';
    if (key.includes('CANCELADO')) return 'estatus-afiliado-pill--cancelado';
    return 'estatus-afiliado-pill--default';
  }

  /** Usa icono/color del API si existe, sino fallback por nombre */
  getIconoMovimientoItem(m: any): { icon: string; class: string; color?: string } {
    const tm = m?.tipoMovimiento;
    if (typeof tm === 'string') {
      return { ...this.getIconoMovimiento(tm), color: undefined };
    }
    if (tm?.icono) {
      const icon = tm.icono.startsWith('fa-') ? tm.icono : `fa-${tm.icono}`;
      return { icon, class: 'icon-dinamico', color: tm.color };
    }
    const nombre = tm?.nombre || m?.tipo || '';
    return { ...this.getIconoMovimiento(nombre), color: undefined };
  }

  etiquetaTipoMovimientoHistorial(m: any): string {
    const tm = m?.tipoMovimiento;
    if (typeof tm === 'string') return tm;
    return tm?.nombre || m?.tipo || 'Sin registro';
  }

  getIconoMovimiento(tipo: string): { class: string; icon: string } {
    const t = (tipo || '').toLowerCase();
    if (t.includes('cargar') || t.includes('carga')) return { class: 'icon-carga', icon: 'fa-arrow-up' };
    if (t.includes('descargar') || t.includes('descarga')) return { class: 'icon-descarga', icon: 'fa-arrow-down' };
    if (t.includes('traspaso')) return { class: 'icon-traspaso', icon: 'fa-exchange-alt' };
    if (t.includes('ajuste')) return { class: 'icon-ajuste', icon: 'fa-balance-scale' };
    if (t.includes('reemplaz')) return { class: 'icon-reemplazo', icon: 'fa-sync-alt' };
    if (t.includes('juego') || t.includes('apuesta')) return { class: 'icon-juego', icon: 'fa-gamepad' };
    if (t.includes('promocion') || t.includes('bono')) return { class: 'icon-promo', icon: 'fa-gift' };
    return { class: 'icon-otro', icon: 'fa-exchange-alt' };
  }

  abrirReemplazarMonedero(rowData: any) {
    this.monederoSeleccionadoReemplazar = {
      id: rowData.id,
      numeroMonedero: rowData.numeroMonedero,
      alias: rowData.alias
    };
    this.reemplazarMonederoForm.patchValue({
      idMonederoAnterior: rowData.id,
      numeroMonederoNuevo: '',
      motivo: '',
      transferirSaldo: true
    });
    this.modalRef = this.modalService.open(this.modalReemplazarMonedero, {
      size: 'md',
      windowClass: 'modal-holder modal-reemplazar-monedero',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
  }

  guardarReemplazarMonedero() {
    if (this.reemplazarMonederoForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Complete el número del monedero nuevo y el motivo.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    const payload = {
      idMonederoAnterior: Number(this.reemplazarMonederoForm.value.idMonederoAnterior),
      numeroMonederoNuevo: (this.reemplazarMonederoForm.value.numeroMonederoNuevo || '').trim(),
      motivo: (this.reemplazarMonederoForm.value.motivo || '').trim(),
      transferirSaldo: !!this.reemplazarMonederoForm.value.transferirSaldo
    };
    this.guardandoReemplazarMonedero = true;
    this.monederosService
      .reemplazarMonedero(payload)
      .pipe(finalize(() => (this.guardandoReemplazarMonedero = false)))
      .subscribe({
      next: () => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha reemplazado el monedero correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        if (this.modalRef) this.modalRef.close();
        this.reemplazarMonederoForm.reset();
        this.monederoSeleccionadoReemplazar = null;
        this.setupDataSource();
        if (this.dataGrid?.instance) this.dataGrid.instance.refresh();
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo reemplazar el monedero.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarCambiarEstatus() {
    if (this.cambiarEstatusForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Complete el nuevo estatus y el motivo.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    const payload = {
      idMonedero: Number(this.cambiarEstatusForm.value.idMonedero),
      idEstatusMonedero: Number(this.cambiarEstatusForm.value.idEstatusMonedero),
      motivo: (this.cambiarEstatusForm.value.motivo || '').trim()
    };

    const enviar = () => {
      this.guardandoCambiarEstatusMonedero = true;
      this.monederosService
        .cambiarEstatus(payload)
        .pipe(finalize(() => (this.guardandoCambiarEstatusMonedero = false)))
        .subscribe({
          next: () => {
            Swal.fire({
              title: '¡Operación Exitosa!',
              text: 'Se ha cambiado el estatus del monedero.',
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            if (this.modalRef) this.modalRef.close();
            this.cambiarEstatusForm.reset();
            this.monederoSeleccionadoCambio = null;
            this.setupDataSource();
            if (this.dataGrid?.instance) this.dataGrid.instance.refresh();
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error?.error?.message || error?.error || 'No se pudo cambiar el estatus del monedero.',
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          }
        });
    };

    if (this.esEstatusMonederoCanceladoPorId(payload.idEstatusMonedero)) {
      Swal.fire({
        title: '¡Advertencia!',
        html:
          'Ha elegido <strong>Cancelado</strong>. Si confirma con <strong>OK</strong>, el monedero quedará cancelado por completo y <strong>no podrá volver a activarse</strong>.<br><br>' +
          'Si no desea cancelarlo, use <strong>Cancelar</strong> en esta alerta.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancelar',
        background: '#0d121d'
      }).then((result) => {
        if (result.isConfirmed) {
          enviar();
        }
      });
      return;
    }

    enviar();
  }

  desactivar(rowData: any) {
    Swal.fire({
      title: '¡Desactivar!',
      html: `¿Está seguro que requiere desactivar este monedero "${rowData.numeroMonedero || rowData.alias}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.monederosService.updateEstatus(rowData.id, 0).subscribe({
          next: (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El monedero ha sido desactivado.`,
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
              text: error.error || 'No se pudo desactivar el monedero.',
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

    this.listaMonederos = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 20;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.monederosService.obtenerMonederosData(page, take, this.mostrarTodosEstatus)
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
            // Obtener información del estatus monedero
            const idEstatusMonedero = item?.idEstatusMonedero;
            const estatusMonedero = this.listaEstatusMonedero.find((e: any) => e.id === idEstatusMonedero);
            const estatusMonederoTexto = estatusMonedero?.nombre || item?.nombreEstatusMonedero || 'Sin registro';
            const estatusMonederoCodigo = String(estatusMonedero?.codigo ?? item?.codigoEstatusMonedero ?? '').trim();

            return {
              ...item,
              estatusTexto:
                item?.estatus === 1 ? 'Activo' :
                  item?.estatus === 0 ? 'Inactivo' : null,
              esPrincipalTexto: item?.esPrincipal === 1 ? 'Sí' : 'No',
              nombreCompletoAfiliado: `${item?.nombreAfiliado || ''} ${item?.apellidoPaternoAfiliado || ''} ${item?.apellidoMaternoAfiliado || ''}`.trim(),
              estatusMonederoTexto,
              estatusMonederoCodigo
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
      grid?.option('dataSource', this.listaMonederos);
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
        normalizar(row?.esPrincipalTexto),
        normalizar(row?.nombreCompletoAfiliado),
        normalizar(row?.estatusMonederoTexto)
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

  /**
   * Alterna el alcance del listado: por defecto solo monederos operativos; activado, incluye todos.
   * Reconstruye el `CustomStore` para que la siguiente carga refleje el nuevo parámetro.
   */
  toggleMostrarTodosEstatus(): void {
    this.mostrarTodosEstatus = !this.mostrarTodosEstatus;
    this.setupDataSource();
    if (this.dataGrid?.instance) {
      this.dataGrid.instance.pageIndex(0);
      this.dataGrid.instance.refresh();
    }
  }

  /** `idSala` del login para filtrar turnos activos en el modal de descarga. */
  private obtenerIdSalaUsuarioLogueado(): number | null {
    try {
      const u = this.auth.getUser();
      if (u == null) {
        return null;
      }
      const raw = (u as unknown as { idSala?: unknown }).idSala;
      if (raw === undefined || raw === null || raw === '') {
        return null;
      }
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }

  /** Etiqueta del combo: `Monedero: {número}` y `Nombre: {titular}` (nombre + apellido paterno del afiliado). */
  private textoEtiquetaSelectMonedero(m: any): string {
    const num = String(m?.numeroMonedero ?? '').trim();
    const nom = String(m?.nombreAfiliado ?? '').trim();
    const apPat = String(m?.apellidoPaternoAfiliado ?? '').trim();
    const apMat = String(m?.apellidoMaternoAfiliado ?? '').trim();
    const titular = `${nom} ${apPat} ${apMat}`.trim();
    const parteMonedero = num ? `Monedero: ${num}` : 'Monedero: —';
    const parteNombre = titular ? `Nombre: ${titular}` : '';
    if (parteNombre) {
      return `${parteMonedero} · ${parteNombre}`;
    }
    if (num) {
      return parteMonedero;
    }
    if (titular) {
      return `Nombre: ${titular}`;
    }
    const alias = String(m?.alias ?? '').trim();
    return alias ? `Monedero: ${alias}` : 'Monedero';
  }

  /**
   * Traspaso (GET /monederos/afiliado/…): `Monedero: {número}` y `Saldo: {redimible}` desde `saldos.redimible`.
   * Acepta `numero` o `numeroMonedero` según el contrato del API.
   */
  private textoEtiquetaSelectMonederoTraspaso(m: any): string {
    const num = String(m?.numeroMonedero ?? m?.numero ?? '').trim();
    const rawRed = m?.saldos?.redimible ?? m?.redimible;
    let saldoTxt = '—';
    if (rawRed !== undefined && rawRed !== null && rawRed !== '') {
      const n = Number(rawRed);
      if (Number.isFinite(n)) {
        saldoTxt = this.formatearMoneda(n);
      }
    }
    const parteMonedero = num ? `Monedero: ${num}` : 'Monedero: —';
    const parteSaldo = `Saldo: ${saldoTxt}`;
    return `${parteMonedero} · ${parteSaldo}`;
  }

  /**
   * Normaliza la respuesta de `GET /monederos/afiliado/{idAfiliado}` a un arreglo de monederos.
   */
  private extraerListaMonederosRespuestaAfiliado(response: any): any[] {
    if (response == null) {
      return [];
    }
    const root = response.data != null ? response.data : response;
    if (Array.isArray(root)) {
      return root;
    }
    if (root && typeof root === 'object') {
      if (Array.isArray(root.monederos)) {
        return root.monederos;
      }
      if (Array.isArray(root.data)) {
        return root.data;
      }
      if (Array.isArray(root.items)) {
        return root.items;
      }
    }
    return [];
  }

  /**
   * Cajas derivadas de turnos abiertos (`GET /pos/turnos/activos`).
   * - `idCaja` (defecto): `id` del combo = id de caja → `POST /pos/monederos/descargar`.
   * - `idTurnoCaja`: `id` del combo = id del turno → `POST /monederos/traspaso`.
   */
  private mapearCajasDesdeTurnosActivos(
    respTurnos: any,
    valorSelect: 'idCaja' | 'idTurnoCaja' = 'idCaja'
  ): any[] {
    const raw = respTurnos?.data ?? respTurnos;
    const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
    const seen = new Set<number>();
    const out: any[] = [];
    for (const t of arr) {
      const cajaNested = t?.caja;
      const cajaSrc =
        cajaNested != null && typeof cajaNested === 'object' && !Array.isArray(cajaNested) ? cajaNested : t;
      const idCaja = Number(cajaSrc?.id ?? t?.idCaja);
      const idTurnoVal = Number(t?.idTurnoCaja ?? t?.idTurno ?? t?.id);

      if (valorSelect === 'idTurnoCaja') {
        if (!Number.isFinite(idTurnoVal) || idTurnoVal <= 0 || seen.has(idTurnoVal)) {
          continue;
        }
        seen.add(idTurnoVal);
      } else {
        if (!Number.isFinite(idCaja) || idCaja <= 0 || seen.has(idCaja)) {
          continue;
        }
        seen.add(idCaja);
      }

      const codigo = String(cajaSrc?.codigo ?? t?.codigoCaja ?? t?.codigo ?? '').trim();
      const nombre = String(cajaSrc?.nombre ?? t?.nombreCaja ?? t?.nombre ?? '').trim();
      let text = '';
      if (codigo && nombre) {
        text = `Nombre: ${nombre} · Código: ${codigo}`;
      } else if (codigo) {
        text = `Código: ${codigo}`;
      } else if (nombre) {
        text = `Nombre: ${nombre}`;
      } else {
        text = Number.isFinite(idCaja) && idCaja > 0 ? `Caja #${idCaja}` : 'Caja';
      }
      const idTurnoTexto = t?.id ?? t?.idTurno ?? t?.idTurnoCaja;
      if (idTurnoTexto != null && idTurnoTexto !== '') {
        text = `${text} · Turno #${idTurnoTexto}`;
      }

      const comboId = valorSelect === 'idTurnoCaja' ? idTurnoVal : idCaja;
      out.push({ ...t, id: comboId, idCaja, idTurnoCaja: idTurnoVal, text });
    }
    return out;
  }

  /**
   * Cajas donde el POS puede mover efectivo (cargar/descargar monedero, traspaso).
   * Incluye estatus legados 1/2 y cajas DISPONIBLE (p. ej. id 5 con turno), según /cajas/list.
   */
  private mapearCajasDisponiblesParaSelect(respCajas: any): any[] {
    const cajasData = respCajas?.data ?? respCajas ?? [];
    const arr = Array.isArray(cajasData) ? cajasData : [];
    return arr
      .filter((c: any) => {
        const estatus = Number(c.idEstatusCaja);
        if (estatus === 1 || estatus === 2 || estatus === 5) {
          return true;
        }
        const cod = String(c.codigoEstatusCaja ?? c.nombreEstatusCaja ?? '')
          .trim()
          .toUpperCase();
        return cod === 'DISPONIBLE';
      })
      .map((c: any) => {
        const codigo = String(c.codigo ?? '').trim();
        const nombre = String(c.nombre ?? '').trim();
        let text = '';
        if (codigo && nombre) {
          text = `Nombre: ${nombre} · Código: ${codigo}`;
        } else if (codigo) {
          text = `Código: ${codigo}`;
        } else if (nombre) {
          text = `Nombre: ${nombre}`;
        } else {
          text = 'Caja sin nombre';
        }
        return {
          ...c,
          id: Number(c.id),
          text,
        };
      });
  }

  cargarMonedero() {
    // Cargar listas necesarias
    forkJoin({
      cajas: this.cajasService.obtenerCajas(),
      monederos: this.monederosService.obtenerMonederos()
    }).subscribe({
      next: (responses) => {
        this.listaCajasCargar = this.mapearCajasDisponiblesParaSelect(responses.cajas);

        this.listaMonederosDisponibles = (responses.monederos.data || []).map((m: any) => {
          const nombreCompletoAfiliado = `${m?.nombreAfiliado || ''} ${m?.apellidoPaternoAfiliado || ''} ${m?.apellidoMaternoAfiliado || ''}`.trim() || 'Sin afiliado';
          return {
            ...m,
            id: Number(m.id),
            nombreCompletoAfiliado,
            text: this.textoEtiquetaSelectMonedero(m)
          };
        });

        this.modalRef = this.modalService.open(this.modalCargarMonedero, {
          size: 'lg',
          windowClass: 'modal-holder modal-cargar-monedero',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las listas necesarias.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarCargarMonedero() {
    if (this.cargarMonederoForm.invalid) {
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

    const payload = {
      idCaja: this.cargarMonederoForm.value.idCaja,
      idMonedero: this.cargarMonederoForm.value.idMonedero,
      monto: Number(this.cargarMonederoForm.value.monto)
    };

    this.guardandoCargarMonedero = true;
    this.monederosService
      .cargarMonedero(payload)
      .pipe(finalize(() => (this.guardandoCargarMonedero = false)))
      .subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha cargado efectivo al monedero de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.cargarMonederoForm.reset();
        this.setupDataSource();
        if (this.dataGrid) {
          this.dataGrid.instance.refresh();
        }
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo cargar el monedero.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
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

  /**
   * `fechaMovimiento` del historial en ISO con `Z` (UTC). Usa componentes UTC para que la hora
   * en pantalla coincida con la del JSON del servicio (p. ej. 12:03 en `...T12:03:00.000Z`).
   */
  formatearFechaHoraMovimientoHistorial(fecha: string | null): string {
    if (!fecha) return 'Sin registro';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Sin registro';
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = d.getUTCFullYear();
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const min = String(d.getUTCMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return 'Sin registro';
    }
  }

  descargarMonedero() {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('descargarEfectivoMonedero', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('descargarEfectivoMonedero');
      return;
    }
    // Cargar listas necesarias
    this.abriendoModalDescargar = true;
    const idSala = this.obtenerIdSalaUsuarioLogueado();
    forkJoin({
      turnosActivos: this.turnosActivosDescargaMonedero.obtenerTurnosActivosConSala(idSala),
      monederos: this.monederosService.obtenerMonederos()
    })
      .pipe(finalize(() => (this.abriendoModalDescargar = false)))
      .subscribe({
      next: (responses) => {
        this.listaCajasDescargar = this.mapearCajasDesdeTurnosActivos(responses.turnosActivos);

        this.listaMonederosDisponiblesDescargar = (responses.monederos.data || []).map((m: any) => {
          const nombreCompletoAfiliado = `${m?.nombreAfiliado || ''} ${m?.apellidoPaternoAfiliado || ''} ${m?.apellidoMaternoAfiliado || ''}`.trim() || 'Sin afiliado';
          return {
            ...m,
            id: Number(m.id),
            nombreCompletoAfiliado,
            text: this.textoEtiquetaSelectMonedero(m)
          };
        });

        this.modalRef = this.modalService.open(this.modalDescargarMonedero, {
          size: 'lg',
          windowClass: 'modal-holder modal-descargar-monedero',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las listas necesarias.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  consultarSaldo() {
    this.consultaSaldoDesdeAccionFila = false;
    this.saldoData = null;
    this.consultarSaldoForm.reset();
    this.cargarListaMonederosConsultaSaldo();
    this.modalRef = this.modalService.open(this.modalConsultarSaldo, {
      size: 'lg',
      windowClass: 'modal-holder modal-consultar-saldo',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
  }

  /**
   * Desde acciones de la fila: consulta el saldo al instante y abre el modal solo en resultados
   * (no muestra el paso de selección de monedero).ss
   */
  consultarSaldoDesdeAccionesFila(rowData: any): void {
    const numero = String(rowData?.numeroMonedero ?? '').trim();
    if (!numero) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Este registro no tiene número de monedero para consultar.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    this.consultaSaldoFilaSub?.unsubscribe();
    this.consultaSaldoFilaSub = undefined;
    this.consultaSaldoDesdeAccionFila = true;
    this.saldoData = null;
    this.consultarSaldoForm.reset();
    this.cargandoConsultaSaldoFila = true;
    this.modalRef = this.modalService.open(this.modalConsultarSaldo, {
      size: 'lg',
      windowClass: 'modal-holder modal-consultar-saldo',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
    this.consultaSaldoFilaSub = this.monederosService
      .consultarSaldoMonedero(numero)
      .pipe(
        finalize(() => {
          this.cargandoConsultaSaldoFila = false;
          this.consultaSaldoFilaSub = undefined;
        })
      )
      .subscribe({
        next: (response) => {
          if (!this.modalRef) {
            return;
          }
          this.saldoData = response;
        },
        error: (error) => {
          const texto =
            error?.error?.message || error?.error || 'No se pudo consultar el saldo del monedero.';
          this.cerrarModal();
          Swal.fire({
            title: '¡Error!',
            text: texto,
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
        },
      });
  }

  /** Pie izquierdo del modal «Consultar saldo»: según origen (fila vs pestaña) y si hay resultados. */
  onPieIzquierdoModalConsultarSaldo(): void {
    if (this.consultaSaldoDesdeAccionFila && this.saldoData) {
      this.cerrarModal();
      return;
    }
    if (this.saldoData) {
      this.saldoData = null;
      return;
    }
    this.cerrarModal();
  }

  etiquetaPieIzquierdoConsultarSaldo(): string {
    if (this.saldoData && this.consultaSaldoDesdeAccionFila) {
      return 'Cerrar';
    }
    if (this.saldoData) {
      return 'Nueva Consulta';
    }
    return 'Cancelar';
  }

  iconoPieIzquierdoConsultarSaldo(): string {
    if (this.saldoData && !this.consultaSaldoDesdeAccionFila) {
      return 'fa-arrow-left';
    }
    return 'fa-times';
  }

  private cargarListaMonederosConsultaSaldo(): void {
    this.cargandoMonederosConsultaSaldo = true;
    this.monederosService
      .obtenerMonederos()
      .pipe(finalize(() => (this.cargandoMonederosConsultaSaldo = false)))
      .subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response?.data) ? response.data : [];
        this.listaMonederosConsultaSaldo = rows
          .map((m: any) => {
            const numeroMonedero = String(m?.numeroMonedero ?? '').trim();
            return {
              id: m?.id != null ? Number(m.id) : undefined,
              numeroMonedero,
              text: this.textoEtiquetaSelectMonedero(m),
            };
          })
          .filter((row: { numeroMonedero: string }) => row.numeroMonedero.length > 0);
      },
      error: () => {
        this.listaMonederosConsultaSaldo = [];
      },
    });
  }

  buscarSaldo() {
    if (this.consultarSaldoForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Selecciona el monedero que deseas consultar.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }

    const raw = this.consultarSaldoForm.value.numero;
    const numero = raw == null ? '' : String(raw).trim();
    this.consultandoSaldo = true;

    this.monederosService
      .consultarSaldoMonedero(numero)
      .pipe(finalize(() => (this.consultandoSaldo = false)))
      .subscribe({
      next: (response) => {
        this.saldoData = response;
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo consultar el saldo del monedero.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  /** Mismo formato monetario visual que Cajas (`agregar-caja` → `monto-input-formato.util`). El `FormControl` sigue guardando número. */
  onMontoModalInput(ev: Event, ctrl: AbstractControl | null): void {
    aplicarMontoInputEnCampo(ev.target as HTMLInputElement, ctrl);
  }

  onMontoModalBlur(ev: Event, ctrl: AbstractControl | null): void {
    aplicarMontoBlurEnCampo(ev.target as HTMLInputElement, ctrl);
  }

  onMontoModalFocus(ev: FocusEvent, ctrl: AbstractControl | null): void {
    const el = ev.target as HTMLInputElement;
    el.value = textoMontoDesdeValorControl(ctrl?.value);
  }

  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return '$0.00';
    return `$${Number(valor).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  formatearFechaHoraCompleta(fecha: string | null): string {
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

  guardarDescargarMonedero() {
    const rol = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('descargarEfectivoMonedero', rol)) {
      this.rolAcceso.mostrarAccesoDenegado('descargarEfectivoMonedero');
      return;
    }
    if (this.descargarMonederoForm.invalid) {
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

    const payload = {
      idCaja: this.descargarMonederoForm.value.idCaja,
      idMonedero: this.descargarMonederoForm.value.idMonedero,
      monto: Number(this.descargarMonederoForm.value.monto)
    };

    this.guardandoDescargarMonedero = true;
    this.monederosService
      .descargarMonedero(payload)
      .pipe(finalize(() => (this.guardandoDescargarMonedero = false)))
      .subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha descargado efectivo del monedero de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.setupDataSource();
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo descargar el efectivo del monedero.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  traspasoMonedero() {
    this.abriendoModalTraspaso = true;
    const idSala = this.obtenerIdSalaUsuarioLogueado();
    forkJoin({
      afiliados: this.monederosService.obtenerAfiliados(),
      turnosActivos: this.turnosActivosDescargaMonedero.obtenerTurnosActivosConSala(idSala)
    })
      .pipe(finalize(() => (this.abriendoModalTraspaso = false)))
      .subscribe({
      next: (responses) => {
        this.listaAfiliadosTraspaso = (responses.afiliados.data || []).map((a: any) => {
          const text = `${a.nombre || ''} ${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''}`.trim();
          return { ...a, id: Number(a.id), text: text || 'Sin nombre' };
        });
        this.listaCajasTraspaso = this.mapearCajasDesdeTurnosActivos(responses.turnosActivos, 'idTurnoCaja');
        this.listaMonederosTraspaso = [];
        this.traspasoMonederoForm.patchValue({
          idTurnoCaja: null,
          idMonederoOrigen: null,
          idMonederoDestino: null,
        });
        this.modalRef = this.modalService.open(this.modalTraspaso, {
          size: 'lg',
          windowClass: 'modal-holder modal-traspaso',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las listas necesarias.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  onAfiliadoChangeTraspaso(event: any) {
    const idRaw = event?.value ?? this.traspasoMonederoForm.get('idAfiliado')?.value;
    const idAfiliado = idRaw != null && idRaw !== '' ? Number(idRaw) : NaN;
    this.traspasoMonederoForm.patchValue({
      idTurnoCaja: null,
      idMonederoOrigen: null,
      idMonederoDestino: null,
    });
    if (!Number.isFinite(idAfiliado) || idAfiliado <= 0) {
      this.listaMonederosTraspaso = [];
      return;
    }
    this.monederosService.obtenerMonederosPorAfiliado(idAfiliado).subscribe({
      next: (response) => {
        const lista = this.extraerListaMonederosRespuestaAfiliado(response);
        this.listaMonederosTraspaso = lista.map((m: any) => ({
          ...m,
          id: Number(m.id),
          text: this.textoEtiquetaSelectMonederoTraspaso(m),
        }));
      },
      error: () => {
        this.listaMonederosTraspaso = [];
      },
    });
  }

  guardarTraspasoMonedero() {
    if (this.traspasoMonederoForm.invalid) {
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
    const vals = this.traspasoMonederoForm.value;
    if (vals.idMonederoOrigen === vals.idMonederoDestino) {
      Swal.fire({
        title: '¡Atención!',
        text: 'El monedero origen y destino deben ser diferentes.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    const payload = {
      idTurnoCaja: Number(vals.idTurnoCaja),
      idMonederoOrigen: Number(vals.idMonederoOrigen),
      idMonederoDestino: Number(vals.idMonederoDestino),
      monto: Number(vals.monto)
    };
    this.guardandoTraspasoMonedero = true;
    this.monederosService
      .traspasoMonedero(payload)
      .pipe(finalize(() => (this.guardandoTraspasoMonedero = false)))
      .subscribe({
      next: () => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha traspasado el saldo entre monederos correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.setupDataSource();
        if (this.dataGrid) {
          this.dataGrid.instance.refresh();
        }
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error?.message || error.error || 'No se pudo realizar el traspaso.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  verMonederosPorAfiliado() {
    this.abriendoModalMonederosAfiliado = true;
    this.monederosService
      .obtenerAfiliados()
      .pipe(finalize(() => (this.abriendoModalMonederosAfiliado = false)))
      .subscribe({
      next: (response) => {
        this.listaAfiliadosMonederos = (response.data || []).map((a: any) => {
          const text = `${a.nombre || ''} ${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''}`.trim();
          return { ...a, id: Number(a.id), text: text || 'Sin nombre' };
        });
        this.listaMonederosAfiliado = [];
        this.monederosPorAfiliadoForm.reset();
        this.modalRef = this.modalService.open(this.modalMonederosPorAfiliado, {
          size: 'lg',
          windowClass: 'modal-holder modal-monederos-afiliado',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar los afiliados.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  /** Etiqueta de estatus para modal "Monederos por afiliado" (API puede enviar texto o id numérico). */
  monederoAfiliadoEstatusTexto(m: any): string {
    if (!m) return '—';
    const raw = m.estatus ?? m.nombreEstatusMonedero ?? m.idEstatusMonedero;
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    if (raw !== undefined && raw !== null && raw !== '') {
      return this.monederoAfiliadoEstatusActivo(m) ? 'Activo' : 'Inactivo';
    }
    return '—';
  }

  monederoAfiliadoEstatusActivo(m: any): boolean {
    if (!m) return false;
    const raw = m.estatus ?? m.idEstatusMonedero ?? m.nombreEstatusMonedero;
    if (raw === undefined || raw === null || raw === '') return false;
    if (typeof raw === 'string') {
      const t = raw.toLowerCase().trim();
      return t === 'activo';
    }
    return Number(raw) === 1;
  }

  monederoAfiliadoTitulo(m: any): string {
    const num = (m?.numeroMonedero ?? m?.numero ?? '').toString().trim();
    const alias = (m?.alias ?? '').toString().trim();
    if (num && alias) return `${num} · ${alias}`;
    return num || alias || 'Monedero';
  }

  monederoAfiliadoEsPrincipal(m: any): boolean {
    const v = m?.esPrincipal;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const t = v.toLowerCase().trim();
      return t === 'true' || t === '1' || t === 'sí' || t === 'si';
    }
    return Number(v) === 1;
  }

  monederoAfiliadoFilasDetalle(m: any): { label: string; value: string }[] {
    const rows: { label: string; value: string }[] = [];
    const fc = m?.fechaCreacion ?? m?.fechaAlta ?? m?.fechaRegistro;
    rows.push({
      label: 'Fecha de alta',
      value: fc ? this.formatearFechaHoraCompleta(String(fc)) : '—'
    });
    for (const line of this.monederoAfiliadoLineasSaldo(m)) {
      rows.push({ label: line.label, value: line.valor });
    }
    return rows;
  }

  /** Saldos anidados (`saldos`) o campos en raíz; omite claves que parezcan identificadores. */
  monederoAfiliadoLineasSaldo(m: any): { label: string; valor: string }[] {
    const out: { label: string; valor: string }[] = [];
    const seen = new Set<string>();

    const add = (dedupeKey: string, label: string, valor: string) => {
      const k = dedupeKey.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ label, valor });
    };

    const s = m?.saldos;
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      for (const key of Object.keys(s)) {
        if (/^id/i.test(key)) continue;
        const raw = (s as any)[key];
        if (raw === undefined || raw === null || raw === '') continue;
        const label = this.etiquetaSaldoAfiliado(key) ?? this.humanizarClaveCampoAfiliado(key);
        add(key, label, this.formatearValorCampoSaldoAfiliado(key, raw));
      }
    }

    const tryRoot = (field: string, label: string, dedupe: string) => {
      if (m[field] === undefined || m[field] === null || m[field] === '') return;
      add(dedupe, label, this.formatearValorCampoSaldoAfiliado(field, m[field]));
    };

    tryRoot('saldoEfectivo', 'Efectivo', 'efectivo');
    tryRoot('saldoPromocional', 'Promocional', 'promocional');
    tryRoot('saldoPuntos', 'Puntos', 'puntos');

    return out;
  }

  private etiquetaSaldoAfiliado(key: string): string | null {
    const map: Record<string, string> = {
      efectivo: 'Efectivo',
      promocional: 'Promocional',
      puntos: 'Puntos',
      totalJugable: 'Total jugable',
      redimible: 'Redimible',
      saldoEfectivo: 'Efectivo',
      saldoPromocional: 'Promocional',
      saldoPuntos: 'Puntos',
      total: 'Total'
    };
    return map[key] ?? null;
  }

  private humanizarClaveCampoAfiliado(key: string): string {
    if (!key) return key;
    const spaced = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  private formatearValorCampoSaldoAfiliado(key: string, raw: any): string {
    if (typeof raw === 'boolean') return raw ? 'Sí' : 'No';
    if (typeof raw === 'string' && raw.trim() !== '' && Number.isNaN(Number(raw))) return raw;
    const n = Number(raw);
    if (!Number.isFinite(n)) return String(raw);
    const kl = key.toLowerCase();
    if (kl.includes('punto')) {
      return n.toLocaleString('es-MX', { maximumFractionDigits: 0 });
    }
    return this.formatearMoneda(n);
  }

  onAfiliadoChangeMonederos(event: any) {
    const idAfiliado = event.value;
    this.listaMonederosAfiliado = [];
    if (!idAfiliado) return;
    this.cargandoMonederosAfiliado = true;
    this.monederosService.obtenerMonederosPorAfiliado(idAfiliado).subscribe({
      next: (response) => {
        this.cargandoMonederosAfiliado = false;
        this.listaMonederosAfiliado = this.extraerListaMonederosRespuestaAfiliado(response);
      },
      error: () => {
        this.cargandoMonederosAfiliado = false;
        this.listaMonederosAfiliado = [];
      }
    });
  }

  cerrarModal() {
    this.consultaSaldoFilaSub?.unsubscribe();
    this.consultaSaldoFilaSub = undefined;
    this.cargandoConsultaSaldoFila = false;
    this.consultaSaldoDesdeAccionFila = false;
    if (this.modalRef) {
      this.modalRef.close();
      this.cargarMonederoForm.reset();
      this.descargarMonederoForm.reset();
      this.consultarSaldoForm.reset();
      this.cambiarEstatusForm.reset();
      this.traspasoMonederoForm.reset();
      this.monederosPorAfiliadoForm.reset();
      this.reemplazarMonederoForm.reset();
      this.ajusteMonederoForm.reset();
      this.saldoData = null;
      this.consultandoSaldo = false;
      this.guardandoCargarMonedero = false;
      this.guardandoDescargarMonedero = false;
      this.guardandoCambiarEstatusMonedero = false;
      this.guardandoAjusteMonedero = false;
      this.guardandoReemplazarMonedero = false;
      this.guardandoTraspasoMonedero = false;
      this.monederoSeleccionadoCambio = null;
      this.monederoSeleccionadoReemplazar = null;
      this.listaMonederosAfiliado = [];
    }
  }
}
