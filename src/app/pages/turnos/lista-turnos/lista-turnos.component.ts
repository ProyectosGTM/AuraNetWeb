import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { forkJoin, lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import { TurnosActivosService } from 'src/app/shared/services/turnos-activos.service';
import { TurnosService } from 'src/app/shared/services/turnos.service';
import { UsuariosService } from 'src/app/shared/services/usuario.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import Swal from 'sweetalert2';

type SelectItem = { id: number; text: string };

@Component({
  selector: 'app-lista-turnos',
  templateUrl: './lista-turnos.component.html',
  styleUrl: './lista-turnos.component.scss',
  animations: [fadeInRightAnimation],
})
export class ListaTurnosComponent {
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaTurnos: any;
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

  @ViewChild('modalAbrirTurno', { static: false }) modalAbrirTurno!: TemplateRef<any>;
  @ViewChild('modalCerrarTurno', { static: false }) modalCerrarTurno!: TemplateRef<any>;
  @ViewChild('modalReponerTurno', { static: false }) modalReponerTurno!: TemplateRef<any>;
  @ViewChild('modalRetirarTurno', { static: false }) modalRetirarTurno!: TemplateRef<any>;
  @ViewChild('modalConsultarSaldoCaja', { static: false }) modalConsultarSaldoCaja!: TemplateRef<any>;
  @ViewChild('modalResumenTurno', { static: false }) modalResumenTurno!: TemplateRef<any>;
  @ViewChild('modalMovimientosTurno', { static: false }) modalMovimientosTurno!: TemplateRef<any>;
  @ViewChild('modalSuspenderTurno', { static: false }) modalSuspenderTurno!: TemplateRef<any>;
  private modalRef?: NgbModalRef;

  // Turnos activos (GET /pos/turnos/activos)
  turnosActivos: any[] = [];
  loadingTurnosActivos = false;

  // Resumen turno (GET /pos/turnos/resumen/saldos/{id})
  resumenTurnoData: any = null;
  loadingResumenTurno = false;

  // Movimientos turno (GET /pos/turnos/movimientos/{id})
  movimientosTurnoData: any[] = [];
  loadingMovimientosTurno = false;

  // Consulta filtrada (GET /pos/turnos/consulta/filtrada)
  filterParams: { [key: string]: string | number | boolean } = {};
  filtrosForm: FormGroup;
  listaCajasParaFiltro: { id: number; text: string }[] = [];
  listaEstatusTurnoParaFiltro: { id: number; text: string }[] = [];
  listaSalasParaFiltro: { id: number; text: string }[] = [];
  listaUsuariosParaFiltro: { id: number; text: string }[] = [];
  listaResultadoArqueoParaFiltro: { id: number; text: string }[] = [
    { id: 1, text: 'Cuadrado' },
    { id: 2, text: 'Sobrante' },
    { id: 3, text: 'Faltante' }
  ];
  mostrarFiltrosAvanzados = false;

  // Formulario para abrir turno
  abrirTurnoForm: FormGroup;
  public listaCajas: any[] = [];
  public listaTesoreria: any[] = [];
  public listaEstatusTurno: SelectItem[] = [];

  // Formulario para cerrar turno
  cerrarTurnoForm: FormGroup;
  public listaTurnosActivos: any[] = [];

  // Reponer efectivo (Tesorería -> Caja)
  reponerTurnoForm: FormGroup;
  listaCajasReponer: { id: number; text: string }[] = [];

  // Retirar efectivo (Caja -> Tesorería)
  retirarTurnoForm: FormGroup;
  listaCajasRetirar: { id: number; text: string }[] = [];

  // Suspender turno (POST /pos/turnos/suspender)
  suspenderTurnoForm: FormGroup;
  listaCajasSuspender: { id: number; text: string }[] = [];

  // Consultar saldo caja
  consultarSaldoCajaForm: FormGroup;
  listaCajasSaldo: { id: number; text: string }[] = [];
  saldoCajaData: any = null;
  consultandoSaldoCaja = false;

  constructor(
    private router: Router,
    private turnosService: TurnosService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private cajasService: CajasService,
    private tesoreriaService: TesoreriaService,
    private transaccionesService: TransaccionesService,
    private turnosActivosService: TurnosActivosService,
    private usuariosService: UsuariosService,
    private salasService: SalaService,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
    this.abrirTurnoForm = this.fb.group({
      idCaja: [null, Validators.required],
      idTesoreria: [null, Validators.required],
      idEstatusTurno: [null, Validators.required],
      fondoInicial: ['', [Validators.required, Validators.min(0)]]
    });

    this.cerrarTurnoForm = this.fb.group({
      idTurno: [null, Validators.required],
      fondoContado: ['', [Validators.required, Validators.min(0)]],
      observaciones: ['']
    });

    this.reponerTurnoForm = this.fb.group({
      idCaja: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      motivo: ['', Validators.required]
    });

    this.retirarTurnoForm = this.fb.group({
      idCaja: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      motivo: ['', Validators.required]
    });

    this.suspenderTurnoForm = this.fb.group({
      idCaja: [null, Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(1)]],
      efectivoContado: ['', [Validators.required, Validators.min(0)]]
    });

    this.consultarSaldoCajaForm = this.fb.group({
      idCaja: [null, Validators.required]
    });

    this.filtrosForm = this.fb.group({
      idCaja: [null],
      idEstatusTurno: [null],
      idSala: [null],
      idUsuario: [null],
      idResultadoArqueo: [null],
      fechaDesde: [null],
      fechaHasta: [null],
      soloDiferencias: [false]
    });
  }

  ngOnInit() {
    this.setupDataSource();
    this.cargarTurnosActivos();
    this.cargarListasParaFiltros();
  }

  cargarListasParaFiltros() {
    forkJoin({
      cajas: this.cajasService.obtenerCajas(),
      estatus: this.turnosService.obtenerEstatusTurno(),
      salas: this.salasService.obtenerSalas(),
      usuarios: this.usuariosService.obtenerUsuarios()
    }).subscribe({
      next: (r) => {
        const cajasData = r.cajas?.data || [];
        this.listaCajasParaFiltro = cajasData.map((c: any) => ({
          id: Number(c.id),
          text: `${c.codigo || ''} - ${c.nombre || ''}`.trim() || 'Sin nombre'
        }));
        const estatusData = r.estatus?.data || [];
        this.listaEstatusTurnoParaFiltro = estatusData.map((e: any) => ({
          id: Number(e.id),
          text: e.nombre || e.nombreEstatusTurno || ''
        }));
        const salasData = r.salas?.data || [];
        this.listaSalasParaFiltro = salasData.map((s: any) => ({
          id: Number(s.id),
          text: s.nombre || s.nombreComercial || 'Sin nombre'
        }));
        const usuariosData = r.usuarios?.data || [];
        this.listaUsuariosParaFiltro = usuariosData.map((u: any) => ({
          id: Number(u.id || u.Id),
          text: u.nombreCompleto || `${u.nombre || u.Nombre || ''} ${u.apellidoPaterno || u.ApellidoPaterno || ''}`.trim() || 'Sin nombre'
        }));
      }
    });
  }

  cargarTurnosActivos() {
    this.loadingTurnosActivos = true;
    this.turnosService.obtenerTurnosActivos().subscribe({
      next: (resp) => {
        this.loadingTurnosActivos = false;
        const data = resp?.data ?? resp;
        this.turnosActivos = Array.isArray(data) ? data : (data ? [data] : []);
      },
      error: () => {
        this.loadingTurnosActivos = false;
        this.turnosActivos = [];
      }
    });
  }

  toggleExpandGroups() {
    this.autoExpandAllGroups = !this.autoExpandAllGroups;
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.option('grouping.autoExpandAll', this.autoExpandAllGroups);
    }
  }

  limpiarCampos() {
    this.filterParams = {};
    this.filtrosForm?.reset({ idCaja: null, idEstatusTurno: null });
    if (this.dataGrid && this.dataGrid.instance) {
      this.dataGrid.instance.clearFilter();
      this.dataGrid.instance.clearGrouping();
      this.dataGrid.instance.clearSorting();
      this.filtroActivo = '';
      this.setupDataSource();
      this.dataGrid.instance.refresh();
    }
  }

  aplicarFiltros() {
    const v = this.filtrosForm.value;
    this.filterParams = {};
    
    if (v.idCaja != null && v.idCaja !== '') this.filterParams['idCaja'] = Number(v.idCaja);
    if (v.idEstatusTurno != null && v.idEstatusTurno !== '') this.filterParams['idEstatusTurno'] = Number(v.idEstatusTurno);
    if (v.idSala != null && v.idSala !== '') this.filterParams['idSala'] = Number(v.idSala);
    if (v.idUsuario != null && v.idUsuario !== '') this.filterParams['idUsuario'] = Number(v.idUsuario);
    if (v.idResultadoArqueo != null && v.idResultadoArqueo !== '') this.filterParams['idResultadoArqueo'] = Number(v.idResultadoArqueo);
    if (v.fechaDesde) this.filterParams['fechaDesde'] = v.fechaDesde;
    if (v.fechaHasta) this.filterParams['fechaHasta'] = v.fechaHasta;
    if (v.soloDiferencias === true) this.filterParams['soloDiferencias'] = true;
    
    this.setupDataSource();
    if (this.dataGrid?.instance) this.dataGrid.instance.refresh();
  }

  limpiarFiltros() {
    this.filterParams = {};
    this.filtrosForm.reset({
      idCaja: null,
      idEstatusTurno: null,
      idSala: null,
      idUsuario: null,
      idResultadoArqueo: null,
      fechaDesde: null,
      fechaHasta: null,
      soloDiferencias: false
    });
    this.setupDataSource();
    if (this.dataGrid?.instance) this.dataGrid.instance.refresh();
  }

  verResumenTurno(idTurno: number) {
    if (idTurno == null || idTurno === undefined) return;
    this.resumenTurnoData = null;
    this.loadingResumenTurno = true;
    this.modalRef = this.modalService.open(this.modalResumenTurno, {
      size: 'lg',
      windowClass: 'modal-holder modal-resumen-turno',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
    this.turnosService.obtenerResumenTurno(Number(idTurno)).subscribe({
      next: (resp) => {
        this.loadingResumenTurno = false;
        this.resumenTurnoData = resp?.data ?? resp ?? null;
      },
      error: (err) => {
        this.loadingResumenTurno = false;
        this.resumenTurnoData = null;
        Swal.fire({
          title: 'Error',
          text: err?.error?.message || err?.error || 'No se pudo cargar el resumen del turno.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Cerrar',
        });
      }
    });
  }

  verMovimientosTurno(idTurno: number) {
    if (idTurno == null || idTurno === undefined) return;
    this.movimientosTurnoData = [];
    this.loadingMovimientosTurno = true;
    this.modalRef = this.modalService.open(this.modalMovimientosTurno, {
      size: 'lg',
      windowClass: 'modal-holder modal-movimientos-turno',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
    this.turnosService.obtenerMovimientosTurno(Number(idTurno)).subscribe({
      next: (resp) => {
        this.loadingMovimientosTurno = false;
        const list = resp?.data ?? resp;
        this.movimientosTurnoData = Array.isArray(list) ? list : list?.movimientos ? list.movimientos : [];
      },
      error: (err) => {
        this.loadingMovimientosTurno = false;
        this.movimientosTurnoData = [];
        Swal.fire({
          title: 'Error',
          text: err?.error?.message || err?.error || 'No se pudieron cargar los movimientos.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Cerrar',
        });
      }
    });
  }

  cerrarModalResumen() {
    if (this.modalRef) this.modalRef.close();
    this.resumenTurnoData = null;
  }

  cerrarModalMovimientos() {
    if (this.modalRef) this.modalRef.close();
    this.movimientosTurnoData = [];
  }

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  setupDataSource() {
    this.loading = true;

    this.listaTurnos = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const hasFiltros = this.filterParams && Object.keys(this.filterParams).length > 0;
          const resp: any = hasFiltros
            ? await lastValueFrom(
                this.turnosService.obtenerTurnosConsultaFiltrada({
                  ...this.filterParams,
                  limit: take,
                  offset: skip
                })
              )
            : await lastValueFrom(
                this.turnosService.obtenerTurnosData(page, take)
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
            const sinRegistro = (value: any): string => {
              return value !== null && value !== undefined && value !== '' ? value : 'Sin registro';
            };

            // Concatenar nombre completo del cliente
            const nombreCompletoCliente = [
              item?.nombreCliente,
              item?.apellidoPaternoCliente,
              item?.apellidoMaternoCliente
            ].filter(Boolean).join(' ').trim() || 'Sin registro';

            // Concatenar nombre completo del usuario
            const nombreCompletoUsuario = [
              item?.nombreUsuario,
              item?.apellidoPaternoUsuario,
              item?.apellidoMaternoUsuario
            ].filter(Boolean).join(' ').trim() || 'Sin registro';

            // Formatear estatus con badge
            const estatusTexto = item?.estatus === 1 ? 'Activo' : item?.estatus === 0 ? 'Inactivo' : 'Sin registro';

            // Badge para estatus turno
            const estatusTurnoTexto = item?.nombreEstatusTurno || 'Sin registro';
            const estatusTurnoColor = item?.colorEstatusTurno || '#6c757d';

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

            return {
              ...item,
              estatusTexto,
              estatusTurnoTexto,
              estatusTurnoColor,
              nombreCompletoCliente,
              nombreCompletoUsuario,
              fechaAperturaFormateada: formatearFechaHora(item?.fechaApertura),
              fechaCierreFormateada: formatearFechaHora(item?.fechaCierre),
              fechaTesoreriaFormateada: formatearFecha(item?.fechaTesoreria),
              fondoInicialFormateado: item?.fondoInicial !== null && item?.fondoInicial !== undefined 
                ? `$${Number(item.fondoInicial).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : 'Sin registro',
              fondoContadoFormateado: item?.fondoContado !== null && item?.fondoContado !== undefined 
                ? `$${Number(item.fondoContado).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : 'Sin registro',
              fondoCierreFormateado: (item?.fondoCierre ?? item?.fondoContado) != null
                ? `$${Number(item.fondoCierre ?? item.fondoContado).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'Sin registro',
              diferencia: item?.diferencia !== null && item?.diferencia !== undefined ? Number(item.diferencia) : 0,
              diferenciaFormateada: item?.diferencia !== null && item?.diferencia !== undefined 
                ? `$${Number(item.diferencia).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : 'Sin registro',
              numeroOperaciones: item?.numeroOperaciones !== null && item?.numeroOperaciones !== undefined 
                ? item.numeroOperaciones 
                : 0,
              codigoCaja: sinRegistro(item?.codigoCaja),
              nombreCaja: sinRegistro(item?.nombreCaja),
              descripcionCaja: sinRegistro(item?.descripcionCaja),
              rfcCliente: sinRegistro(item?.rfcCliente),
              codigoEstatusTurno: sinRegistro(item?.codigoEstatusTurno),
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
          Swal.fire({
            title: '¡Error!',
            text: 'No se pudo obtener la información de turnos.',
            icon: 'error',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Confirmar',
          });
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
      grid?.option('dataSource', this.listaTurnos);
      return;
    }
    this.filtroActivo = texto;

    const filtered = this.paginaActualData.filter((row: any) => {
      const searchFields = [
        row.nombreCompletoCliente,
        row.nombreCompletoUsuario,
        row.codigoCaja,
        row.nombreCaja,
        row.estatusTurnoTexto,
        row.observaciones,
        row.rfcCliente
      ].map(f => (f || '').toString().toLowerCase());
      return searchFields.some(field => field.includes(texto));
    });

    grid?.option('dataSource', filtered);
  }

  abrirTurno() {
    // Cargar listas necesarias
    forkJoin({
      cajas: this.cajasService.obtenerCajas(),
      tesoreria: this.tesoreriaService.obtenerTesoreriaData(1, 100),
      estatusTurno: this.turnosService.obtenerEstatusTurno()
    }).subscribe({
      next: (responses) => {
        const cajasData = responses.cajas.data || [];
        const cajasAbiertas = cajasData.filter((c: any) => Number(c.idEstatusCaja) === 2);
        this.listaCajas = cajasAbiertas.map((c: any) => ({
          ...c,
          id: Number(c.id),
          text: `${c.codigo || ''} - ${c.nombre || ''}`.trim()
        }));

        this.listaTesoreria = (responses.tesoreria.data || []).map((t: any) => ({
          ...t,
          id: Number(t.id),
          text: `${t.nombreComercialSala || ''} - ${this.formatearFecha(t.fecha) || ''} - ${this.formatearMoneda(t.fondoInicial) || ''}`.trim()
        }));

        this.listaEstatusTurno = (responses.estatusTurno.data || []).map((e: any) => ({
          id: Number(e.id),
          text: e.nombre || e.nombreEstatusTurno || ''
        }));

        this.modalRef = this.modalService.open(this.modalAbrirTurno, {
          size: 'lg',
          windowClass: 'modal-holder modal-abrir-turno',
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

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return '';
    }
  }

  formatearMoneda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined || isNaN(valor)) return '';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  }

  guardarAbrirTurno() {
    if (this.abrirTurnoForm.invalid) {
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
      idCaja: this.abrirTurnoForm.value.idCaja,
      idTesoreria: this.abrirTurnoForm.value.idTesoreria,
      idEstatusTurno: this.abrirTurnoForm.value.idEstatusTurno,
      fondoInicial: Number(this.abrirTurnoForm.value.fondoInicial)
    };

    this.turnosService.abrirTurno(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha abierto el turno de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.abrirTurnoForm.reset();
        this.setupDataSource();
        if (this.dataGrid) {
          this.dataGrid.instance.refresh();
        }
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo abrir el turno.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  cerrarTurno() {
    // Cargar lista de turnos
    this.turnosService.obtenerTurnos().subscribe({
      next: (response) => {
        const turnosData = response?.data || [];
        if (Array.isArray(turnosData) && turnosData.length > 0) {
          this.listaTurnosActivos = turnosData.map((t: any) => ({
            ...t,
            id: Number(t.id),
            text: `Turno #${t.id} - ${t.codigoCaja || ''} - ${this.formatearFechaHora(t.fechaApertura) || ''}`
          }));
        } else {
          this.listaTurnosActivos = [];
        }

        this.modalRef = this.modalService.open(this.modalCerrarTurno, {
          size: 'lg',
          windowClass: 'modal-holder modal-cerrar-turno',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar los turnos.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  formatearFechaHora(fecha: string | null): string {
    if (!fecha) return '';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return '';
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return '';
    }
  }

  esTurnoAbierto(row: any): boolean {
    const codigo = (row?.codigoEstatusTurno || '').toString().toUpperCase().trim();
    return codigo === 'ABIERTO';
  }

  abrirModalReponerDesdeFila(row: any) {
    if (!row?.idCaja) {
      Swal.fire({
        title: '¡Atención!',
        text: 'No hay caja asociada a este turno.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Cerrar',
      });
      return;
    }
    this.listaCajasReponer = [{
      id: Number(row.idCaja),
      text: `${row.codigoCaja || ''} - ${row.nombreCaja || ''} (Turno #${row.id})`.trim() || `Caja ${row.idCaja}`
    }];
    this.reponerTurnoForm.reset({ idCaja: row.idCaja, monto: '', motivo: '' });
    this.reponerTurnoForm.patchValue({ idCaja: row.idCaja });
    this.modalRef = this.modalService.open(this.modalReponerTurno, {
      size: 'lg',
      windowClass: 'modal-holder modal-reponer-turno',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
  }

  abrirModalRetirarDesdeFila(row: any) {
    if (!row?.idCaja) {
      Swal.fire({
        title: '¡Atención!',
        text: 'No hay caja asociada a este turno.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Cerrar',
      });
      return;
    }
    this.listaCajasRetirar = [{
      id: Number(row.idCaja),
      text: `${row.codigoCaja || ''} - ${row.nombreCaja || ''} (Turno #${row.id})`.trim() || `Caja ${row.idCaja}`
    }];
    this.retirarTurnoForm.reset({ idCaja: row.idCaja, monto: '', motivo: '' });
    this.retirarTurnoForm.patchValue({ idCaja: row.idCaja });
    this.modalRef = this.modalService.open(this.modalRetirarTurno, {
      size: 'lg',
      windowClass: 'modal-holder modal-retirar-turno',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
  }

  verSaldoCaja(idCaja: number) {
    if (idCaja == null || idCaja === undefined) {
      Swal.fire({
        title: '¡Atención!',
        text: 'No hay caja asociada a este turno.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Cerrar',
      });
      return;
    }
    this.transaccionesService.obtenerSaldoCaja(Number(idCaja)).subscribe({
      next: (response: any) => {
        const data = response?.data ?? response;
        const saldo = data?.saldo ?? data?.monto ?? data;
        const saldoNum = typeof saldo === 'number' ? saldo : Number(saldo);
        const saldoFormateado = isNaN(saldoNum) ? (typeof saldo === 'string' ? saldo : 'N/A') : this.formatearMoneda(saldoNum);
        Swal.fire({
          title: 'Saldo de Caja',
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
          text: error?.error?.message || error?.error || 'No se pudo obtener el saldo de la caja.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Cerrar',
        });
      }
    });
  }

  reponerTurno() {
    this.reponerTurnoForm.reset({ idCaja: null, monto: '', motivo: '' });
    this.listaCajasReponer = [];
    this.modalRef = this.modalService.open(this.modalReponerTurno, {
      size: 'lg',
      windowClass: 'modal-holder modal-reponer-turno',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });

    this.turnosActivosService.obtenerTurnosActivos().subscribe({
      next: (response) => {
        const turnosData = response?.data ?? response;
        const turnos = Array.isArray(turnosData) ? turnosData : [];
        const seen = new Set<number>();
        this.listaCajasReponer = turnos
          .filter((t: any) => {
            if (t?.idCaja == null) return false;
            const id = Number(t.idCaja);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .map((t: any) => ({
            id: Number(t.idCaja),
            text: `${t.codigoCaja || ''} - ${t.nombreCaja || ''} (Turno #${t.id})`.trim() || `Caja ${t.idCaja}`
          }));
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || 'No se pudieron cargar los turnos activos.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  suspenderTurno() {
    this.suspenderTurnoForm.reset({ idCaja: null, motivo: '', efectivoContado: '' });
    this.listaCajasSuspender = [];
    this.modalRef = this.modalService.open(this.modalSuspenderTurno, {
      size: 'lg',
      windowClass: 'modal-holder modal-suspender-turno',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
    this.turnosActivosService.obtenerTurnosActivos().subscribe({
      next: (response) => {
        const turnosData = response?.data ?? response;
        const turnos = Array.isArray(turnosData) ? turnosData : [];
        const seen = new Set<number>();
        this.listaCajasSuspender = turnos
          .filter((t: any) => {
            if (t?.idCaja == null) return false;
            const id = Number(t.idCaja);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .map((t: any) => ({
            id: Number(t.idCaja),
            text: `${t.codigoCaja || ''} - ${t.nombreCaja || ''} (Turno #${t.id})`.trim() || `Caja ${t.idCaja}`
          }));
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || 'No se pudieron cargar los turnos activos.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  abrirModalSuspenderDesdeFila(row: any) {
    this.suspenderTurnoForm.reset({ idCaja: row.idCaja, motivo: '', efectivoContado: '' });
    this.listaCajasSuspender = [{ id: Number(row.idCaja), text: `${row.codigoCaja || ''} - ${row.nombreCaja || ''}`.trim() || `Caja ${row.idCaja}` }];
    this.modalRef = this.modalService.open(this.modalSuspenderTurno, {
      size: 'lg',
      windowClass: 'modal-holder modal-suspender-turno',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
  }

  guardarSuspenderTurno() {
    if (this.suspenderTurnoForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Complete todos los campos requeridos (caja, motivo y efectivo contado).',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    const payload = {
      idCaja: Number(this.suspenderTurnoForm.value.idCaja),
      motivo: (this.suspenderTurnoForm.value.motivo || '').trim(),
      efectivoContado: Number(this.suspenderTurnoForm.value.efectivoContado)
    };
    this.turnosService.suspenderTurno(payload).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Operación exitosa!',
          text: 'El turno se ha suspendido correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.suspenderTurnoForm.reset();
        this.cargarTurnosActivos();
        this.setupDataSource();
        if (this.dataGrid?.instance) this.dataGrid.instance.refresh();
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo suspender el turno.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  retirarTurno() {
    this.retirarTurnoForm.reset({ idCaja: null, monto: '', motivo: '' });
    this.listaCajasRetirar = [];
    this.modalRef = this.modalService.open(this.modalRetirarTurno, {
      size: 'lg',
      windowClass: 'modal-holder modal-retirar-turno',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });

    this.turnosActivosService.obtenerTurnosActivos().subscribe({
      next: (response) => {
        const turnosData = response?.data ?? response;
        const turnos = Array.isArray(turnosData) ? turnosData : [];
        const seen = new Set<number>();
        this.listaCajasRetirar = turnos
          .filter((t: any) => {
            if (t?.idCaja == null) return false;
            const id = Number(t.idCaja);
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          })
          .map((t: any) => ({
            id: Number(t.idCaja),
            text: `${t.codigoCaja || ''} - ${t.nombreCaja || ''} (Turno #${t.id})`.trim() || `Caja ${t.idCaja}`
          }));
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || 'No se pudieron cargar los turnos activos.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarRetirarTurno() {
    if (this.retirarTurnoForm.invalid) {
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
      idCaja: Number(this.retirarTurnoForm.value.idCaja),
      monto: Number(this.retirarTurnoForm.value.monto),
      motivo: (this.retirarTurnoForm.value.motivo || '').trim()
    };

    this.turnosService.retirarTurno(payload).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha retirado efectivo de la caja correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.retirarTurnoForm.reset();
        this.setupDataSource();
        if (this.dataGrid) {
          this.dataGrid.instance.refresh();
        }
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo retirar el efectivo.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarReponerTurno() {
    if (this.reponerTurnoForm.invalid) {
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
      idCaja: Number(this.reponerTurnoForm.value.idCaja),
      monto: Number(this.reponerTurnoForm.value.monto),
      motivo: (this.reponerTurnoForm.value.motivo || '').trim()
    };

    this.turnosService.reponerTurno(payload).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha repuesto efectivo a la caja correctamente.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.reponerTurnoForm.reset();
        this.setupDataSource();
        if (this.dataGrid) {
          this.dataGrid.instance.refresh();
        }
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error?.error?.message || error?.error || 'No se pudo reponer el efectivo.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  guardarCerrarTurno() {
    if (this.cerrarTurnoForm.invalid) {
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
      idTurno: this.cerrarTurnoForm.value.idTurno,
      fondoContado: Number(this.cerrarTurnoForm.value.fondoContado),
      observaciones: this.cerrarTurnoForm.value.observaciones || null
    };

    this.turnosService.cerrarTurno(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: '¡Operación Exitosa!',
          text: 'Se ha cerrado el turno de manera exitosa.',
          icon: 'success',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
        this.cerrarModal();
        this.cerrarTurnoForm.reset();
        this.setupDataSource();
        if (this.dataGrid) {
          this.dataGrid.instance.refresh();
        }
      },
      error: (error) => {
        Swal.fire({
          title: '¡Error!',
          text: error.error || 'No se pudo cerrar el turno.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  consultarSaldoCaja() {
    this.saldoCajaData = null;
    this.consultarSaldoCajaForm.reset();
    this.cajasService.obtenerCajas().subscribe({
      next: (resp) => {
        const cajasData = resp.data || [];
        const cajasAbiertas = cajasData.filter((c: any) => Number(c.idEstatusCaja) === 2);
        this.listaCajasSaldo = cajasAbiertas.map((c: any) => ({
          id: Number(c.id),
          text: `${c.codigo || ''} - ${c.nombre || ''}`.trim() || 'Sin nombre'
        }));
        this.modalRef = this.modalService.open(this.modalConsultarSaldoCaja, {
          size: 'lg',
          windowClass: 'modal-holder modal-consultar-saldo-caja',
          centered: true,
          backdrop: 'static',
          keyboard: true
        });
      },
      error: () => {
        Swal.fire({
          title: '¡Error!',
          text: 'No se pudieron cargar las cajas.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Confirmar',
        });
      }
    });
  }

  nuevaConsultaSaldoCaja() {
    this.saldoCajaData = null;
  }

  buscarSaldoCaja() {
    if (this.consultarSaldoCajaForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Seleccione una caja.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }
    const id = Number(this.consultarSaldoCajaForm.value.idCaja);
    this.consultandoSaldoCaja = true;
    this.transaccionesService.obtenerSaldoCaja(id).subscribe({
      next: (response) => {
        this.consultandoSaldoCaja = false;
        this.saldoCajaData = response?.data ?? response;
      },
      error: (err) => {
        this.consultandoSaldoCaja = false;
        Swal.fire({
          title: '¡Error!',
          text: err?.error?.message || err?.error || 'No se pudo obtener el saldo de la caja.',
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
      this.abrirTurnoForm.reset();
      this.cerrarTurnoForm.reset();
      this.reponerTurnoForm.reset();
      this.retirarTurnoForm.reset();
      this.suspenderTurnoForm.reset();
      this.consultarSaldoCajaForm.reset();
      this.saldoCajaData = null;
    }
  }
}
