import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AfiliadosEstatusService } from 'src/app/shared/services/afiliados-estatus.service';
import { AfiliadosService } from 'src/app/shared/services/afiliados.service';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import Swal from 'sweetalert2';

type ModoLista = 'paginado' | 'inactivos' | 'cumpleaneros' | 'buscar';

type CumpleanerosTipo = 'hoy' | 'mes';

@Component({
  selector: 'app-lista-afiliados',
  templateUrl: './lista-afiliados.component.html',
  styleUrl: './lista-afiliados.component.scss',
  animations: [fadeInRightAnimation],
})
export class ListaAfiliadosComponent implements OnInit {

  isLoading: boolean = false;
  listaAfiliados: any;
  public grid: boolean = false;
  public showFilterRow: boolean;
  public showHeaderFilter: boolean;
  public loadingVisible: boolean = false;
  public mensajeAgrupar: string = "Arrastre un encabezado de columna aquí para agrupar por esa columna";
  public loading: boolean;
  public loadingMessage: string = 'Cargando...';
  public paginaActual: number = 1;
  public totalRegistros: number = 0;
  public pageSize: number = 20;
  public totalPaginas: number = 0;
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid: DxDataGridComponent;
  @ViewChild('modalFiltrosGrid', { static: false }) modalFiltrosGrid!: TemplateRef<any>;
  @ViewChild('modalBloquearAfiliado', { static: false }) modalBloquearAfiliado!: TemplateRef<any>;
  @ViewChild('modalAutoexclusionAfiliado', { static: false }) modalAutoexclusionAfiliado!: TemplateRef<any>;
  @ViewChild('modalNivelVipAfiliado', { static: false }) modalNivelVipAfiliado!: TemplateRef<any>;
  @ViewChild('modalCumpleanerosTipo', { static: false }) modalCumpleanerosTipo!: TemplateRef<any>;
  @ViewChild('modalResumenAfiliado', { static: false }) modalResumenAfiliado!: TemplateRef<any>;
  @ViewChild('modalMonederosAfiliado', { static: false }) modalMonederosAfiliado!: TemplateRef<any>;

  private modalFiltrosRef?: NgbModalRef;
  private modalBloquearRef?: NgbModalRef;
  private modalAutoexclusionRef?: NgbModalRef;
  private modalNivelVipRef?: NgbModalRef;
  private modalCumpleanerosRef?: NgbModalRef;
  private modalResumenRef?: NgbModalRef;
  private modalMonederosRef?: NgbModalRef;

  /** Contexto del modal POST /afiliados/{id}/bloquear */
  afiliadoBloqueoId: number | null = null;
  afiliadoBloqueoEtiqueta = '';
  bloqueoMotivo = '';
  bloqueoFechaFin = '';
  /** Límite inferior del datepicker (hoy local, YYYY-MM-DD), alineado al contrato de fecha fin. */
  bloqueoFechaMin = '';
  bloqueoEnProceso = false;

  /** Contexto del modal POST /afiliados/{id}/autoexclusion */
  afiliadoAutoexclusionId: number | null = null;
  afiliadoAutoexclusionEtiqueta = '';
  autoexclusionMotivo = '';
  autoexclusionDuracionDias: number | string = '';
  autoexclusionObservaciones = '';
  autoexclusionEnProceso = false;

  /** Contexto del modal POST /afiliados/{id}/nivel-vip */
  vipAfiliadoId: number | null = null;
  vipAfiliadoEtiqueta = '';
  vipIdNivelSeleccionado: number | null = null;
  vipMotivo = '';
  vipEnProceso = false;
  nivelesVipOpciones: { id: number; text: string }[] = [];
  resumenAfiliadoData: any = null;
  resumenAfiliadoCargando = false;
  resumenAfiliadoEtiqueta = '';
  monederosAfiliadoData: any[] = [];
  monederosAfiliadoCargando = false;
  monederosAfiliadoEtiqueta = '';

  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

  /** Vista del listado: API paginada, inactivos, cumpleañeros o búsqueda con filtros. */
  modoLista: ModoLista = 'paginado';

  /** Selección en modal GET /afiliados/cumpleaneros (null = ninguna). */
  cumpleanerosTipoSeleccion: CumpleanerosTipo | null = null;
  /** Último `tipo` confirmado para la carga del grid (hoy | mes). */
  cumpleanerosTipoActivo: CumpleanerosTipo | null = null;
  cumpleanerosTotal = 0;

  /** Filtros para GET /afiliados/buscar (nombres de query alineados al backend). */
  filtroTexto = '';
  filtroNombre = '';
  filtroApellidoPaterno = '';
  filtroApellidoMaterno = '';
  filtroNumeroIdentificacion = '';
  /** idSala para búsqueda; null = sin filtrar por sala (lista desde GET /salas/list). */
  filtroIdSala: number | null = null;
  salasParaFiltro: { id: number; nombreSala?: string; nombreComercialSala?: string }[] = [];

  /** Búsqueda rápida por GET /afiliados/numero/{numero} */
  numeroIdentificacionRapido = '';

  constructor(
    private afiliadosService: AfiliadosService,
    private afiliadosEstatusService: AfiliadosEstatusService,
    private salaService: SalaService,
    private router: Router,
    private modalService: NgbModal,
    private rolAcceso: RolAccesoService
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
  }

  ngOnInit(): void {
    this.setupDataSource();
    this.cargarSalasParaFiltro();
  }

  private cargarSalasParaFiltro(): void {
    this.salaService.obtenerSalas().subscribe({
      next: (res: any) => {
        const raw = this.normalizarListaResponse(res);
        this.salasParaFiltro = raw
          .filter((s: any) => s?.id != null)
          .map((s: any) => ({
            id: Number(s.id),
            nombreSala: s.nombreSala,
            nombreComercialSala: s.nombreComercialSala,
          }));
      },
      error: (err) => {
        console.error('No se pudieron cargar las salas para el filtro:', err);
        this.salasParaFiltro = [];
      },
    });
  }

  agregar() {
    this.router.navigateByUrl('/afiliados/agregar-afiliado');
  }

  /**
   * Muestra "Registrar autoexclusión" solo si no hay periodo vigente (`autoexclusionHasta` vacío/null).
   */
  puedeRegistrarAutoexclusion(fila: any): boolean {
    const v = fila?.autoexclusionHasta;
    if (v === null || v === undefined) {
      return true;
    }
    if (typeof v === 'string' && v.trim() === '') {
      return true;
    }
    return false;
  }

  /** Fecha local en YYYY-MM-DD (cuerpo Swagger `fechaFinBloqueo`). */
  private static fechaLocalYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Valida y normaliza `fechaFinBloqueo` para POST /afiliados/{id}/bloquear (solo fecha, YYYY-MM-DD).
   * Discriminante `error` | `fecha` para que el compilador estreche bien en el llamador.
   */
  private parseFechaFinBloqueoSwagger(raw: unknown): { fecha: string } | { error: string } {
    let s = '';
    if (raw instanceof Date) {
      if (!isNaN(raw.getTime())) {
        s = ListaAfiliadosComponent.fechaLocalYYYYMMDD(raw);
      }
    } else {
      s = String(raw || '').trim();
    }
    if (!s) {
      return { error: 'Selecciona la fecha fin del bloqueo (AAAA-MM-DD).' };
    }
    if (s.includes('T')) {
      s = s.slice(0, 10);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return { error: 'La fecha fin debe ir en formato AAAA-MM-DD.' };
    }
    const [ys, ms, ds] = s.split('-').map((x) => Number(x));
    const dt = new Date(ys, ms - 1, ds);
    if (dt.getFullYear() !== ys || dt.getMonth() !== ms - 1 || dt.getDate() !== ds) {
      return { error: 'La fecha fin de bloqueo no es una fecha válida.' };
    }
    const hoy = ListaAfiliadosComponent.fechaLocalYYYYMMDD(new Date());
    if (s < hoy) {
      return { error: 'La fecha fin de bloqueo no puede ser anterior a hoy.' };
    }
    return { fecha: s };
  }

  /** true cuando el grid usa paginación remota contra el servidor. */
  get remotePaging(): boolean {
    return this.modoLista === 'paginado';
  }

  setModoLista(modo: ModoLista) {
    if (modo !== 'cumpleaneros') {
      this.cumpleanerosTipoActivo = null;
      this.cumpleanerosTotal = 0;
    }
    this.modoLista = modo;
    this.setupDataSource();
    setTimeout(() => this.refrescarGrid(), 0);
  }

  abrirModalCumpleanerosTipo() {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('verCumpleanerosAfiliados', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('verCumpleanerosAfiliados');
      return;
    }
    this.cumpleanerosTipoSeleccion =
      this.modoLista === 'cumpleaneros' && this.cumpleanerosTipoActivo
        ? this.cumpleanerosTipoActivo
        : null;
    this.modalCumpleanerosRef = this.modalService.open(this.modalCumpleanerosTipo, {
      size: 'md',
      windowClass: 'modal-holder modal-afiliados-cumpleaneros-tipo',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    });
  }

  cerrarModalCumpleanerosTipo() {
    if (this.modalCumpleanerosRef) {
      this.modalCumpleanerosRef.close();
      this.modalCumpleanerosRef = undefined;
    }
  }

  seleccionarTipoCumpleaneros(tipo: CumpleanerosTipo) {
    this.cumpleanerosTipoSeleccion = tipo;
  }

  confirmarCumpleanerosTipo() {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('verCumpleanerosAfiliados', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('verCumpleanerosAfiliados');
      return;
    }
    if (this.cumpleanerosTipoSeleccion == null) {
      Swal.fire({
        title: 'Selecciona un período',
        text: 'Elige si deseas ver cumpleañeros del día de hoy o de todo el mes.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    this.cumpleanerosTipoActivo = this.cumpleanerosTipoSeleccion;
    this.cerrarModalCumpleanerosTipo();
    this.setModoLista('cumpleaneros');
  }

  aplicarBusquedaFiltros() {
    this.cumpleanerosTipoActivo = null;
    this.modoLista = 'buscar';
    this.setupDataSource();
    setTimeout(() => this.refrescarGrid(), 0);
  }

  abrirModalFiltrosGrid() {
    this.modalFiltrosRef = this.modalService.open(this.modalFiltrosGrid, {
      size: 'lg',
      windowClass: 'modal-holder modal-afiliados-filtros-grid',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    });
  }

  cerrarModalFiltrosGrid() {
    if (this.modalFiltrosRef) {
      this.modalFiltrosRef.close();
      this.modalFiltrosRef = undefined;
    }
  }

  aplicarBusquedaFiltrosDesdeModal() {
    this.aplicarBusquedaFiltros();
    this.cerrarModalFiltrosGrid();
  }

  abrirModalBloquearAfiliado(row: any) {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('bloquearAfiliado', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('bloquearAfiliado');
      return;
    }
    const id = row?.id;
    if (id == null || id === '') {
      return;
    }
    this.afiliadoBloqueoId = Number(id);
    this.afiliadoBloqueoEtiqueta =
      row?.nombreCompleto ||
      [row?.nombre, row?.apellidoPaterno, row?.apellidoMaterno].filter(Boolean).join(' ').trim() ||
      `Afiliado #${id}`;
    this.bloqueoMotivo = '';
    this.bloqueoFechaFin = '';
    this.bloqueoFechaMin = ListaAfiliadosComponent.fechaLocalYYYYMMDD(new Date());
    this.bloqueoEnProceso = false;
    this.modalBloquearRef = this.modalService.open(this.modalBloquearAfiliado, {
      size: 'lg',
      windowClass: 'modal-holder modal-afiliados-bloquear',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    });
  }

  cerrarModalBloquearAfiliado() {
    if (this.modalBloquearRef) {
      this.modalBloquearRef.close();
      this.modalBloquearRef = undefined;
    }
    this.afiliadoBloqueoId = null;
    this.afiliadoBloqueoEtiqueta = '';
    this.bloqueoEnProceso = false;
  }

  abrirModalAutoexclusionAfiliado(row: any) {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('registrarAutoexclusionAfiliado', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('registrarAutoexclusionAfiliado');
      return;
    }
    const id = row?.id;
    if (id == null || id === '') {
      return;
    }
    this.afiliadoAutoexclusionId = Number(id);
    this.afiliadoAutoexclusionEtiqueta =
      row?.nombreCompleto ||
      [row?.nombre, row?.apellidoPaterno, row?.apellidoMaterno].filter(Boolean).join(' ').trim() ||
      `Afiliado #${id}`;
    this.autoexclusionMotivo = '';
    this.autoexclusionDuracionDias = '';
    this.autoexclusionObservaciones = '';
    this.autoexclusionEnProceso = false;
    this.modalAutoexclusionRef = this.modalService.open(this.modalAutoexclusionAfiliado, {
      size: 'lg',
      windowClass: 'modal-holder modal-afiliados-autoexclusion',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    });
  }

  cerrarModalAutoexclusionAfiliado() {
    if (this.modalAutoexclusionRef) {
      this.modalAutoexclusionRef.close();
      this.modalAutoexclusionRef = undefined;
    }
    this.afiliadoAutoexclusionId = null;
    this.afiliadoAutoexclusionEtiqueta = '';
    this.autoexclusionEnProceso = false;
  }

  abrirModalNivelVipAfiliado(row: any) {
    const id = row?.id;
    if (id == null || id === '') {
      return;
    }
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('actualizarNivelVipAfiliado', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('actualizarNivelVipAfiliado');
      return;
    }
    this.vipAfiliadoId = Number(id);
    this.vipAfiliadoEtiqueta =
      row?.nombreCompleto ||
      [row?.nombre, row?.apellidoPaterno, row?.apellidoMaterno].filter(Boolean).join(' ').trim() ||
      `Afiliado #${id}`;
    this.vipIdNivelSeleccionado = null;
    this.vipMotivo = '';
    this.vipEnProceso = false;
    this.nivelesVipOpciones = [];

    this.afiliadosService.obtenerNivelesVip().subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        this.nivelesVipOpciones = raw
          .filter((x: any) => x?.id != null)
          .map((x: any) => ({
            id: Number(x.id),
            text:
              String(x.nombre ?? x.nombreNivelVip ?? x.descripcion ?? '').trim() || `Nivel ${x.id}`,
          }));
        if (!this.nivelesVipOpciones.length) {
          Swal.fire({
            title: 'Sin niveles VIP',
            text: 'No se recibieron niveles desde el catálogo.',
            icon: 'warning',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
          return;
        }
        this.modalNivelVipRef = this.modalService.open(this.modalNivelVipAfiliado, {
          size: 'lg',
          windowClass: 'modal-holder modal-afiliados-nivel-vip',
          centered: true,
          backdrop: 'static',
          keyboard: true,
        });
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el catálogo de niveles VIP.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
        });
      },
    });
  }

  cerrarModalNivelVipAfiliado() {
    if (this.modalNivelVipRef) {
      this.modalNivelVipRef.close();
      this.modalNivelVipRef = undefined;
    }
    this.vipAfiliadoId = null;
    this.vipAfiliadoEtiqueta = '';
    this.vipEnProceso = false;
  }

  confirmarNivelVipAfiliado() {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('actualizarNivelVipAfiliado', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('actualizarNivelVipAfiliado');
      return;
    }
    const motivo = (this.vipMotivo || '').trim();
    if (!motivo) {
      Swal.fire({
        title: 'Motivo requerido',
        text: 'Indica el motivo del cambio de nivel VIP.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    if (this.vipIdNivelSeleccionado == null || !Number.isFinite(Number(this.vipIdNivelSeleccionado))) {
      Swal.fire({
        title: 'Nivel VIP',
        text: 'Selecciona un nivel VIP del catálogo.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    if (this.vipAfiliadoId == null || !Number.isFinite(this.vipAfiliadoId)) {
      return;
    }
    const idNivelVIP = Math.trunc(Number(this.vipIdNivelSeleccionado));
    this.vipEnProceso = true;
    this.afiliadosService
      .actualizarNivelVip(this.vipAfiliadoId, { idNivelVIP, motivo })
      .subscribe({
        next: () => {
          this.vipEnProceso = false;
          this.cerrarModalNivelVipAfiliado();
          Swal.fire({
            title: 'Nivel VIP actualizado',
            text: 'El cambio se registró según el servidor.',
            icon: 'success',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
          this.refrescarGrid();
        },
        error: (error: any) => {
          this.vipEnProceso = false;
          const raw = error?.error?.message ?? error?.error ?? error?.message;
          const text =
            typeof raw === 'string'
              ? raw
              : raw != null
                ? JSON.stringify(raw)
                : 'No se pudo actualizar el nivel VIP.';
          Swal.fire({
            title: 'Error',
            text,
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
        },
      });
  }

  confirmarAutoexclusionAfiliado() {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('registrarAutoexclusionAfiliado', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('registrarAutoexclusionAfiliado');
      return;
    }
    const motivo = (this.autoexclusionMotivo || '').trim();
    if (!motivo) {
      Swal.fire({
        title: 'Motivo requerido',
        text: 'Indica el motivo de la autoexclusión.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    const dias = Math.trunc(Number(this.autoexclusionDuracionDias));
    if (!Number.isFinite(dias) || dias < 30) {
      Swal.fire({
        title: 'Duración inválida',
        text: 'La duración debe ser un número entero de al menos 30 días.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    if (this.afiliadoAutoexclusionId == null || !Number.isFinite(this.afiliadoAutoexclusionId)) {
      return;
    }
    const observaciones = (this.autoexclusionObservaciones || '').trim();
    if (!observaciones) {
      Swal.fire({
        title: 'Observaciones requeridas',
        text: 'Indica observaciones (por ejemplo, constancia o formato firmado).',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    this.autoexclusionEnProceso = true;
    const body: { motivo: string; duracionDias: number; observaciones: string } = {
      motivo,
      duracionDias: dias,
      observaciones,
    };
    this.afiliadosService
      .registrarAutoexclusion(this.afiliadoAutoexclusionId, body)
      .subscribe({
        next: () => {
          this.autoexclusionEnProceso = false;
          this.cerrarModalAutoexclusionAfiliado();
          Swal.fire({
            title: 'Autoexclusión registrada',
            text: 'La solicitud fue registrada según el servidor.',
            icon: 'success',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
          this.refrescarGrid();
        },
        error: (error: any) => {
          this.autoexclusionEnProceso = false;
          const raw = error?.error?.message ?? error?.error ?? error?.message;
          const text =
            typeof raw === 'string'
              ? raw
              : raw != null
                ? JSON.stringify(raw)
                : 'No se pudo registrar la autoexclusión.';
          Swal.fire({
            title: 'Error',
            text,
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
        },
      });
  }

  confirmarBloqueoAfiliado() {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('bloquearAfiliado', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('bloquearAfiliado');
      return;
    }
    const motivo = (this.bloqueoMotivo || '').trim();
    if (!motivo) {
      Swal.fire({
        title: 'Motivo requerido',
        text: 'Indica el motivo del bloqueo.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    const parsedFecha = this.parseFechaFinBloqueoSwagger(this.bloqueoFechaFin || '');
    if ('error' in parsedFecha) {
      Swal.fire({
        title: 'Fecha inválida',
        text: parsedFecha.error,
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    const fechaFinBloqueo = parsedFecha.fecha;
    if (this.afiliadoBloqueoId == null || !Number.isFinite(this.afiliadoBloqueoId)) {
      return;
    }
    this.bloqueoEnProceso = true;
    const body: { motivo: string; fechaFinBloqueo: string } = { motivo, fechaFinBloqueo };
    this.afiliadosService
      .bloquearAfiliado(this.afiliadoBloqueoId, body)
      .subscribe({
        next: () => {
          this.bloqueoEnProceso = false;
          this.cerrarModalBloquearAfiliado();
          Swal.fire({
            title: 'Bloqueo registrado',
            text: 'El afiliado fue bloqueado según el servidor.',
            icon: 'success',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
          this.refrescarGrid();
        },
        error: (error: any) => {
          this.bloqueoEnProceso = false;
          const raw = error?.error?.message ?? error?.error ?? error?.message;
          const text =
            typeof raw === 'string'
              ? raw
              : raw != null
                ? JSON.stringify(raw)
                : 'No se pudo completar el bloqueo.';
          Swal.fire({
            title: 'Error',
            text,
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
        },
      });
  }

  private refrescarGrid() {
    if (this.dataGrid?.instance) {
      this.dataGrid.instance.refresh();
    }
  }

  private construirFiltrosBusqueda(): Record<string, string | number> {
    const f: Record<string, string | number> = {};
    const t = (s: string) => (s || '').trim();
    if (t(this.filtroTexto)) f['texto'] = t(this.filtroTexto);
    if (t(this.filtroNombre)) f['nombre'] = t(this.filtroNombre);
    if (t(this.filtroApellidoPaterno)) f['apellidoPaterno'] = t(this.filtroApellidoPaterno);
    if (t(this.filtroApellidoMaterno)) f['apellidoMaterno'] = t(this.filtroApellidoMaterno);
    if (t(this.filtroNumeroIdentificacion)) f['numeroIdentificacion'] = t(this.filtroNumeroIdentificacion);
    if (this.filtroIdSala != null && !isNaN(Number(this.filtroIdSala))) {
      f['idSala'] = Number(this.filtroIdSala);
    }
    return f;
  }

  private normalizarAfiliadoItem(item: any): any {
    if (!item || typeof item !== 'object') {
      return item;
    }

    return {
      ...item,
      id: item?.id ?? item?.Id ?? null,
      idSala: item?.idSala ?? item?.IdSala ?? null,
      idTipoIdentificacion: item?.idTipoIdentificacion ?? item?.IdTipoIdentificacion ?? null,
      numeroIdentificacion: item?.numeroIdentificacion ?? item?.NumeroIdentificacion ?? null,
      nombre: item?.nombre ?? item?.Nombre ?? null,
      apellidoPaterno: item?.apellidoPaterno ?? item?.ApellidoPaterno ?? null,
      apellidoMaterno: item?.apellidoMaterno ?? item?.ApellidoMaterno ?? null,
      fechaNacimiento: item?.fechaNacimiento ?? item?.FechaNacimiento ?? null,
      sexo: item?.sexo ?? item?.Sexo ?? null,
      email: item?.email ?? item?.Email ?? null,
      telefonoCelular: item?.telefonoCelular ?? item?.TelefonoCelular ?? item?.Telefono ?? null,
      nombreSala: item?.nombreSala ?? item?.NombreSala ?? null,
      nombreComercialSala: item?.nombreComercialSala ?? item?.NombreComercialSala ?? null,
      nombreTipoIdentificacion:
        item?.nombreTipoIdentificacion ?? item?.NombreTipoIdentificacion ?? null,
      nombreEstatusAfiliado: item?.nombreEstatusAfiliado ?? item?.NombreEstatusAfiliado ?? null,
      estatus: item?.estatus ?? item?.Estatus ?? null,
      fechaCreacion: item?.fechaCreacion ?? item?.FechaRegistro ?? null,
      fechaActualizacion: item?.fechaActualizacion ?? item?.FechaActualizacion ?? null,
    };
  }

  private resolverMetaEstatusAfiliado(item: any): { codigo: string; nombre: string } {
    const idEstatus = Number(item?.idEstatusAfiliado ?? item?.estatusAfiliado?.id ?? NaN);
    const codigoRaw = String(item?.codigoEstatusAfiliado ?? item?.estatusAfiliado?.codigo ?? '').trim();
    const nombreRaw = String(item?.nombreEstatusAfiliado ?? item?.estatusAfiliado?.nombre ?? '').trim();

    if (codigoRaw || nombreRaw) {
      return {
        codigo: codigoRaw || this.codigoEstatusPorId(idEstatus),
        nombre: nombreRaw || this.nombreEstatusPorId(idEstatus),
      };
    }

    return {
      codigo: this.codigoEstatusPorId(idEstatus),
      nombre: this.nombreEstatusPorId(idEstatus),
    };
  }

  private codigoEstatusPorId(id: number): string {
    switch (id) {
      case 1:
        return 'ACTIVO';
      case 2:
        return 'BLOQUEADO';
      case 3:
        return 'SUSPENDIDO';
      case 4:
        return 'CERRADO';
      case 5:
        return 'AUTOEXCLUIDO';
      default:
        return '';
    }
  }

  private nombreEstatusPorId(id: number): string {
    switch (id) {
      case 1:
        return 'Activo';
      case 2:
        return 'Bloqueado';
      case 3:
        return 'Suspendido';
      case 4:
        return 'Cerrado';
      case 5:
        return 'Autoexcluido';
      default:
        return 'Sin registro';
    }
  }

  private transformarFila(item: any): any {
    const fila = this.normalizarAfiliadoItem(item);
    const estatusMeta = this.resolverMetaEstatusAfiliado(fila);
    const nombreCompleto = [
      fila?.nombre || '',
      fila?.apellidoPaterno || '',
      fila?.apellidoMaterno || ''
    ].filter(Boolean).join(' ').trim() || 'Sin registro';

    return {
      ...fila,
      nombreCompleto,
      nombreSala: fila?.nombreSala || 'Sin registro',
      nombreComercialSala: fila?.nombreComercialSala || 'Sin registro',
      nombreTipoIdentificacion: fila?.nombreTipoIdentificacion || 'Sin registro',
      nombreEstatusAfiliado: estatusMeta.nombre || 'Sin registro',
      codigoEstatusAfiliado: estatusMeta.codigo || '',
      numeroIdentificacion: this.sinRegistro(fila?.numeroIdentificacion),
      email: this.sinRegistro(fila?.email),
      telefonoCelular: this.sinRegistro(fila?.telefonoCelular),
      estatusTexto: Number(fila?.estatus) === 1 ? 'Activo' : 'Inactivo',
      sexoTexto: fila?.sexo === 'M' ? 'Masculino' : fila?.sexo === 'F' ? 'Femenino' : 'Sin registro',
      fechaNacimientoFormateada: this.formatearFecha(fila?.fechaNacimiento),
      fechaCreacionFormateada: this.formatearFechaHora(fila?.fechaCreacion),
      fechaActualizacionFormateada: this.formatearFechaHora(fila?.fechaActualizacion)
    };
  }

  get esVistaCumpleanerosHoy(): boolean {
    return this.modoLista === 'cumpleaneros' && this.cumpleanerosTipoActivo === 'hoy';
  }

  get esVistaCumpleanerosMes(): boolean {
    return this.modoLista === 'cumpleaneros' && this.cumpleanerosTipoActivo === 'mes';
  }

  get hayCumpleaneros(): boolean {
    return this.modoLista === 'cumpleaneros' && this.cumpleanerosTotal > 0;
  }

  private extraerMesDia(fecha: unknown): { mes: number; dia: number } | null {
    if (fecha == null) return null;
    const raw = String(fecha).trim();
    if (!raw) return null;
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const mes = Number(match[2]);
    const dia = Number(match[3]);
    if (!Number.isFinite(mes) || !Number.isFinite(dia)) return null;
    return { mes, dia };
  }

  esCumpleaneroHoy(row: any): boolean {
    const md = this.extraerMesDia(row?.fechaNacimiento);
    if (!md) return false;
    const hoy = new Date();
    return md.mes === hoy.getMonth() + 1 && md.dia === hoy.getDate();
  }

  getEdadDesdeFechaNacimiento(fecha: unknown): string {
    const raw = String(fecha ?? '').trim();
    if (!raw) return 'Sin registro';
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return 'Sin registro';
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    const nacimiento = new Date(y, m - 1, d);
    if (isNaN(nacimiento.getTime())) return 'Sin registro';
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const aunNoCumple =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
    if (aunNoCumple) edad--;
    return edad >= 0 ? `${edad} años` : 'Sin registro';
  }

  private normalizarListaResponse(res: any): any[] {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  }

  setupDataSource() {
    this.loading = true;
    this.listaAfiliados = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const skip = Number(loadOptions?.skip) || 0;
        const take = Number(loadOptions?.take) || this.pageSize;

        try {
          if (this.modoLista === 'inactivos') {
            const response: any = await lastValueFrom(this.afiliadosService.obtenerAfiliadosInactivos());
            this.loading = false;
            this.cumpleanerosTotal = 0;
            const raw = this.normalizarListaResponse(response);
            const all = raw.map((item: any) => this.transformarFila(item));
            return {
              data: all.slice(skip, skip + take),
              totalCount: all.length
            };
          }

          if (this.modoLista === 'cumpleaneros') {
            if (!this.cumpleanerosTipoActivo) {
              this.loading = false;
              this.cumpleanerosTotal = 0;
              return { data: [], totalCount: 0 };
            }
            const response: any = await lastValueFrom(
              this.afiliadosService.obtenerCumpleaneros(this.cumpleanerosTipoActivo)
            );
            this.loading = false;
            const raw = this.normalizarListaResponse(response);
            const all = raw.map((item: any) => this.transformarFila(item));
            this.cumpleanerosTotal = all.length;
            return {
              data: all.slice(skip, skip + take),
              totalCount: all.length
            };
          }

          if (this.modoLista === 'buscar') {
            this.cumpleanerosTotal = 0;
            const filtros = this.construirFiltrosBusqueda();
            const response: any = await lastValueFrom(
              this.afiliadosService.buscarAfiliados(filtros)
            );
            this.loading = false;
            const raw = this.normalizarListaResponse(response);
            const totalSrv = Number(response?.paginated?.total);
            const all = raw.map((item: any) => this.transformarFila(item));
            if (!isNaN(totalSrv) && totalSrv > 0) {
              this.totalRegistros = totalSrv;
              return { data: all, totalCount: totalSrv };
            }
            return {
              data: all.slice(skip, skip + take),
              totalCount: all.length
            };
          }

          // paginado — GET /afiliados/{page}/{limit}
          const page = Math.floor(skip / take) + 1;
          const response: any = await lastValueFrom(
            this.afiliadosService.obtenerAfiliadosData(page, take)
          );

          this.loading = false;
          this.cumpleanerosTotal = 0;

          const totalRegistros = Number(response?.paginated?.total) || 0;
          const paginaActual = Number(response?.paginated?.page) || page;
          const totalPaginas = take > 0 ? Math.ceil(totalRegistros / take) : 0;

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;

          const dataTransformada = (Array.isArray(response?.data) ? response.data : []).map((item: any) =>
            this.transformarFila(item)
          );

          return {
            data: dataTransformada,
            totalCount: totalRegistros
          };
        } catch (error: any) {
          this.loading = false;
          if (this.modoLista === 'cumpleaneros') {
            this.cumpleanerosTotal = 0;
          }
          console.error('Error al cargar afiliados:', error);
          return {
            data: [],
            totalCount: 0
          };
        }
      }
    });
  }

  buscarPorNumeroIdentificacion() {
    const n = (this.numeroIdentificacionRapido || '').trim();
    if (!n) {
      Swal.fire({
        title: 'Campo vacío',
        text: 'Escribe un número de identificación.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    this.afiliadosService.obtenerAfiliadoPorNumeroIdentificacion(n).subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        const id = d?.id;
        if (id != null && id !== '') {
          Swal.fire({
            title: 'Afiliado encontrado',
            html: `<p style="color:#fff">${this.sinRegistro(d?.nombreCompleto) || [d?.nombre, d?.apellidoPaterno].filter(Boolean).join(' ') || 'ID ' + id}</p>`,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Abrir edición',
            cancelButtonText: 'Cerrar',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          }).then((r) => {
            if (r.isConfirmed) {
              this.actualizarAfiliado(Number(id));
            }
          });
        } else {
          Swal.fire({
            title: 'Sin resultados',
            text: 'No se encontró un afiliado con ese número.',
            icon: 'warning',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
        }
      },
      error: (error) => {
        Swal.fire({
          title: 'Error',
          text: error?.error?.message || error?.error || 'No se pudo consultar.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
        });
      },
    });
  }

  verResumenAfiliado(row: any) {
    const id = row?.id;
    if (id == null) return;
    this.resumenAfiliadoData = null;
    this.resumenAfiliadoCargando = true;
    this.resumenAfiliadoEtiqueta =
      row?.nombreCompleto ||
      [row?.nombre, row?.apellidoPaterno, row?.apellidoMaterno].filter(Boolean).join(' ').trim() ||
      `Afiliado #${id}`;
    this.modalResumenRef = this.modalService.open(this.modalResumenAfiliado, {
      size: 'xl',
      windowClass: 'modal-holder modal-afiliados-resumen',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    });
    this.afiliadosService.obtenerResumenAfiliado(Number(id)).subscribe({
      next: (res: any) => {
        this.resumenAfiliadoData = res?.data ?? res ?? null;
        this.resumenAfiliadoCargando = false;
      },
      error: (error) => {
        this.resumenAfiliadoCargando = false;
        this.cerrarModalResumenAfiliado();
        Swal.fire({
          title: 'Error',
          text: error?.error || 'No se pudo cargar el resumen.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
        });
      },
    });
  }

  verMonederosAfiliado(row: any) {
    const id = row?.id;
    if (id == null) return;
    this.monederosAfiliadoData = [];
    this.monederosAfiliadoCargando = true;
    this.monederosAfiliadoEtiqueta =
      row?.nombreCompleto ||
      [row?.nombre, row?.apellidoPaterno, row?.apellidoMaterno].filter(Boolean).join(' ').trim() ||
      `Afiliado #${id}`;
    this.modalMonederosRef = this.modalService.open(this.modalMonederosAfiliado, {
      size: 'lg',
      windowClass: 'modal-holder modal-afiliados-monederos',
      centered: true,
      backdrop: 'static',
      keyboard: true,
    });
    this.afiliadosService.obtenerMonederosAfiliado(Number(id)).subscribe({
      next: (res: any) => {
        this.monederosAfiliadoData = this.normalizarListaResponse(res);
        this.monederosAfiliadoCargando = false;
      },
      error: (error) => {
        this.monederosAfiliadoCargando = false;
        this.cerrarModalMonederosAfiliado();
        Swal.fire({
          title: 'Error',
          text: error?.error || 'No se pudieron cargar los monederos.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
        });
      },
    });
  }

  cerrarModalResumenAfiliado() {
    if (this.modalResumenRef) {
      this.modalResumenRef.close();
      this.modalResumenRef = undefined;
    }
    this.resumenAfiliadoCargando = false;
    this.resumenAfiliadoData = null;
    this.resumenAfiliadoEtiqueta = '';
  }

  cerrarModalMonederosAfiliado() {
    if (this.modalMonederosRef) {
      this.modalMonederosRef.close();
      this.modalMonederosRef = undefined;
    }
    this.monederosAfiliadoCargando = false;
    this.monederosAfiliadoData = [];
    this.monederosAfiliadoEtiqueta = '';
  }

  private escapeHtml(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  toMoney(valor: unknown): string {
    const n = Number(valor);
    if (!Number.isFinite(n)) return '$0.00';
    return n.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  toNumber(valor: unknown): string {
    const n = Number(valor);
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('es-MX');
  }

  safeText(valor: unknown, fallback = 'Sin registro'): string {
    if (valor == null) return fallback;
    const s = String(valor).trim();
    return s ? this.escapeHtml(s) : fallback;
  }


  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Sin registro';
    try {
      const raw = String(fecha).trim();
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const yyyy = match[1];
        const mm = match[2];
        const dd = match[3];
        return `${dd}/${mm}/${yyyy}`;
      }
      const d = new Date(raw);
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
      const raw = String(fecha).trim();
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
      if (match) {
        const yyyy = match[1];
        const mm = match[2];
        const dd = match[3];
        const hh = match[4] ?? '00';
        const min = match[5] ?? '00';
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
      }
      const d = new Date(raw);
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

  sinRegistro(valor: any): string {
    if (valor === null || valor === undefined || valor === '') {
      return 'Sin registro';
    }
    return valor;
  }

  obtenerClaseEstatusAfiliado(row: any): string {
    const codigo = String(row?.codigoEstatusAfiliado ?? row?.estatusAfiliado?.codigo ?? '')
      .trim()
      .toUpperCase();
    const nombre = String(row?.nombreEstatusAfiliado ?? row?.estatusAfiliado?.nombre ?? '')
      .trim()
      .toUpperCase();
    const key = codigo || nombre;
    if (key.includes('ACTIVO')) return 'estatus-afiliado-pill--activo';
    if (key.includes('BLOQUEADO')) return 'estatus-afiliado-pill--bloqueado';
    if (key.includes('SUSPENDIDO')) return 'estatus-afiliado-pill--suspendido';
    if (key.includes('CERRADO')) return 'estatus-afiliado-pill--cerrado';
    if (key.includes('AUTOEXCLUIDO')) return 'estatus-afiliado-pill--autoexcluido';
    return 'estatus-afiliado-pill--default';
  }

  esAfiliadoBloqueado(row: any): boolean {
    const codigo = String(row?.codigoEstatusAfiliado ?? row?.estatusAfiliado?.codigo ?? '')
      .trim()
      .toUpperCase();
    const nombre = String(row?.nombreEstatusAfiliado ?? row?.estatusAfiliado?.nombre ?? '')
      .trim()
      .toUpperCase();
    const idEstatus = Number(row?.idEstatusAfiliado ?? row?.estatusAfiliado?.id ?? NaN);
    return codigo.includes('BLOQUEADO') || nombre.includes('BLOQUEADO') || idEstatus === 2;
  }

  onPageIndexChanged(event: any) {
    this.paginaActual = event.pageIndex + 1;
  }

  onGridOptionChanged(event: any) {
    if (event.name === 'searchPanel') {
      const searchValue = event.value?.toLowerCase() || '';
      this.filtroActivo = searchValue;
    }
  }

  toggleExpandGroups() {
    this.autoExpandAllGroups = !this.autoExpandAllGroups;
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.option('grouping.autoExpandAll', this.autoExpandAllGroups);
    }
  }

  limpiarCampos() {
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.clearFilter();
      this.dataGrid.instance.clearGrouping();
      this.dataGrid.instance.clearSorting();
      this.dataGrid.instance.searchByText('');
      this.filtroActivo = '';
    }
    this.filtroTexto = '';
    this.filtroNombre = '';
    this.filtroApellidoPaterno = '';
    this.filtroApellidoMaterno = '';
    this.filtroNumeroIdentificacion = '';
    this.filtroIdSala = null;
    this.numeroIdentificacionRapido = '';
    if (this.modoLista !== 'paginado') {
      this.setModoLista('paginado');
    } else {
      this.refrescarGrid();
    }
  }

  actualizarAfiliado(id: number) {
    this.router.navigateByUrl('/afiliados/editar-afiliado/' + id);
  }

  eliminarAfiliado(rowData: any) {
    Swal.fire({
      title: '¡Eliminar!',
      html: `¿Está seguro que requiere eliminar este afiliado "${rowData.nombreCompleto || rowData.numeroIdentificacion}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.afiliadosService.eliminarAfiliado(rowData.id).subscribe({
          next: (response: any) => {
            const msg =
              typeof response?.message === 'string'
                ? response.message
                : 'El afiliado ha sido eliminado (baja lógica).';
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: msg,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            setTimeout(() => this.refrescarGrid(), 0);
          },
          error: (error: any) => {
            const raw = error?.error;
            const text =
              typeof raw === 'string'
                ? raw
                : raw?.message ?? raw?.error ?? 'No se pudo eliminar el afiliado.';
            Swal.fire({
              title: '¡Error!',
              text: typeof text === 'string' ? text : JSON.stringify(text),
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

  cancelarAutoexclusionAfiliado(rowData: any) {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('cancelarAutoexclusionAfiliado', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('cancelarAutoexclusionAfiliado');
      return;
    }
    const nombre = rowData.nombreCompleto || rowData.numeroIdentificacion || `ID ${rowData.id}`;
    Swal.fire({
      title: 'Cancelar autoexclusión',
      html:
        `¿Cancelar la autoexclusión de <strong>${nombre}</strong>?<br><br>` +
        '<small style="color:#94a3b8">Solo aplica cuando ya finalizó el periodo de autoexclusión. Si aún está vigente, el sistema no permitirá completar la operación.</small>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c12a42',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Cerrar',
      background: '#0d121d',
    }).then((result) => {
      if (!result.value) {
        return;
      }
      this.afiliadosService.cancelarAutoexclusion(rowData.id).subscribe({
        next: (response: any) => {
          const msg =
            typeof response?.message === 'string'
              ? response.message
              : 'La autoexclusión fue cancelada.';
          Swal.fire({
            title: 'Listo',
            text: msg,
            icon: 'success',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
          this.setupDataSource();
          setTimeout(() => this.refrescarGrid(), 0);
        },
        error: (error: any) => {
          const status = error?.status;
          const raw = error?.error;
          let text: string;
          if (typeof raw === 'string') {
            text = raw;
          } else if (raw?.message) {
            text = String(raw.message);
          } else if (raw?.error) {
            text = String(raw.error);
          } else {
            text = error?.message || 'No se pudo cancelar la autoexclusión.';
          }
          Swal.fire({
            title: status === 400 ? 'No permitido' : 'Error',
            text,
            icon: status === 400 ? 'warning' : 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
        },
      });
    });
  }

  /** PATCH /afiliados/estatus/{id} con estatus 1 (AfiliadosEstatusService). */
  activarAfiliado(rowData: any) {
    Swal.fire({
      title: '¡Activar!',
      html: `¿Está seguro que requiere activar el afiliado: <strong>${rowData.nombreCompleto || rowData.numeroIdentificacion}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d',
    }).then((result) => {
      if (result.value) {
        this.afiliadosEstatusService.updateEstatus(rowData.id, 1).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Confirmación realizada!',
              html: `El afiliado ha sido activado.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            setTimeout(() => this.refrescarGrid(), 0);
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error.error || 'No se pudo activar el afiliado.',
              icon: 'error',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
          },
        });
      }
    });
  }

  desbloquearAfiliado(rowData: any) {
    const rolUsuario = this.rolAcceso.obtenerRolUsuarioLogueado();
    if (!this.rolAcceso.puedeRealizarAccion('bloquearAfiliado', rolUsuario)) {
      this.rolAcceso.mostrarAccesoDenegado('bloquearAfiliado');
      return;
    }
    Swal.fire({
      title: '¡Desbloquear!',
      html: `¿Está seguro que requiere desbloquear el afiliado: <strong>${rowData.nombreCompleto || rowData.numeroIdentificacion}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.afiliadosService.desbloquearAfiliado(rowData.id).subscribe({
          next: (_response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El afiliado ha sido desbloqueado.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            setTimeout(() => this.refrescarGrid(), 0);
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error.error || 'No se pudo desbloquear el afiliado.',
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
      html: `¿Está seguro que requiere desactivar el afiliado: <strong>${rowData.nombreCompleto || rowData.numeroIdentificacion}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      background: '#0d121d'
    }).then((result) => {
      if (result.value) {
        this.afiliadosEstatusService.updateEstatus(rowData.id, 0).subscribe({
          next: (response) => {
            Swal.fire({
              title: '¡Confirmación Realizada!',
              html: `El afiliado ha sido desactivado.`,
              icon: 'success',
              background: '#0d121d',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'Confirmar',
            });
            this.setupDataSource();
            setTimeout(() => this.refrescarGrid(), 0);
          },
          error: (error) => {
            Swal.fire({
              title: '¡Error!',
              text: error.error || 'No se pudo desactivar el afiliado.',
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
}
