import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AfiliadosService } from 'src/app/shared/services/afiliados.service';
import { RolAccesoService } from 'src/app/shared/services/rol-acceso.service';
import { SalaService } from 'src/app/shared/services/salas.service';
import Swal from 'sweetalert2';

type ModoLista = 'paginado' | 'inactivos' | 'cumpleaneros' | 'buscar';

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

  private modalFiltrosRef?: NgbModalRef;
  private modalBloquearRef?: NgbModalRef;
  private modalAutoexclusionRef?: NgbModalRef;
  private modalNivelVipRef?: NgbModalRef;

  /** Contexto del modal POST /afiliados/{id}/bloquear */
  afiliadoBloqueoId: number | null = null;
  afiliadoBloqueoEtiqueta = '';
  bloqueoMotivo = '';
  bloqueoFechaFin = '';
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

  public autoExpandAllGroups: boolean = true;
  isGrouped: boolean = false;
  public paginaActualData: any[] = [];
  public filtroActivo: string = '';

  /** Vista del listado: API paginada, inactivos, cumpleañeros o búsqueda con filtros. */
  modoLista: ModoLista = 'paginado';

  /** Filtros para GET /afiliados/buscar (ajusta nombres según Swagger). */
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

  /** true cuando el grid usa paginación remota contra el servidor. */
  get remotePaging(): boolean {
    return this.modoLista === 'paginado';
  }

  setModoLista(modo: ModoLista) {
    this.modoLista = modo;
    this.setupDataSource();
    setTimeout(() => this.refrescarGrid(), 0);
  }

  aplicarBusquedaFiltros() {
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
    this.autoexclusionEnProceso = true;
    this.afiliadosService
      .registrarAutoexclusion(this.afiliadoAutoexclusionId, {
        motivo,
        duracionDias: dias,
        observaciones,
      })
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
    const fechaFinBloqueo = (this.bloqueoFechaFin || '').trim();
    if (!fechaFinBloqueo) {
      Swal.fire({
        title: 'Fecha requerida',
        text: 'Selecciona la fecha fin del bloqueo.',
        icon: 'info',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    if (this.afiliadoBloqueoId == null || !Number.isFinite(this.afiliadoBloqueoId)) {
      return;
    }
    this.bloqueoEnProceso = true;
    this.afiliadosService
      .bloquearAfiliado(this.afiliadoBloqueoId, { motivo, fechaFinBloqueo })
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

  private transformarFila(item: any): any {
    const nombreCompleto = [
      item?.nombre || '',
      item?.apellidoPaterno || '',
      item?.apellidoMaterno || ''
    ].filter(Boolean).join(' ').trim() || 'Sin registro';

    return {
      ...item,
      nombreCompleto,
      nombreSala: item?.nombreSala || 'Sin registro',
      nombreComercialSala: item?.nombreComercialSala || 'Sin registro',
      nombreTipoIdentificacion: item?.nombreTipoIdentificacion || 'Sin registro',
      nombreEstatusAfiliado: item?.nombreEstatusAfiliado || 'Sin registro',
      numeroIdentificacion: this.sinRegistro(item?.numeroIdentificacion),
      email: this.sinRegistro(item?.email),
      telefonoCelular: this.sinRegistro(item?.telefonoCelular),
      estatusTexto: item?.estatus === 1 ? 'Activo' : 'Inactivo',
      sexoTexto: item?.sexo === 'M' ? 'Masculino' : item?.sexo === 'F' ? 'Femenino' : 'Sin registro',
      fechaNacimientoFormateada: this.formatearFecha(item?.fechaNacimiento),
      fechaCreacionFormateada: this.formatearFechaHora(item?.fechaCreacion),
      fechaActualizacionFormateada: this.formatearFechaHora(item?.fechaActualizacion)
    };
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
            const raw = this.normalizarListaResponse(response);
            const all = raw.map((item: any) => this.transformarFila(item));
            return {
              data: all.slice(skip, skip + take),
              totalCount: all.length
            };
          }

          if (this.modoLista === 'cumpleaneros') {
            const response: any = await lastValueFrom(this.afiliadosService.obtenerCumpleaneros());
            this.loading = false;
            const raw = this.normalizarListaResponse(response);
            const all = raw.map((item: any) => this.transformarFila(item));
            return {
              data: all.slice(skip, skip + take),
              totalCount: all.length
            };
          }

          if (this.modoLista === 'buscar') {
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
    this.afiliadosService.obtenerResumenAfiliado(Number(id)).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res;
        const json = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
        Swal.fire({
          title: 'Resumen del afiliado',
          html: `<pre style="text-align:left;max-height:360px;overflow:auto;font-size:12px;color:#e2e8f0;background:#0f1419;padding:12px;border-radius:8px;">${this.escapeHtml(json)}</pre>`,
          width: 640,
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
        });
      },
      error: (error) => {
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
    this.afiliadosService.obtenerMonederosAfiliado(Number(id)).subscribe({
      next: (res: any) => {
        const raw = this.normalizarListaResponse(res);
        if (!raw.length) {
          Swal.fire({
            title: 'Monederos',
            text: 'Este afiliado no tiene monederos registrados.',
            icon: 'info',
            background: '#0d121d',
            confirmButtonColor: '#3085d6',
          });
          return;
        }
        const rows = raw
          .map(
            (m: any) =>
              `<tr><td style="padding:6px;border:1px solid #334">${this.escapeHtml(String(m?.numeroMonedero ?? m?.id ?? '—'))}</td>` +
              `<td style="padding:6px;border:1px solid #334">${this.escapeHtml(String(m?.alias ?? '—'))}</td>` +
              `<td style="padding:6px;border:1px solid #334">${this.escapeHtml(String(m?.estatus ?? m?.nombreEstatus ?? '—'))}</td></tr>`
          )
          .join('');
        Swal.fire({
          title: 'Monederos del afiliado',
          html: `<table style="width:100%;color:#fff;border-collapse:collapse;font-size:13px"><thead><tr><th style="padding:6px;border:1px solid #334">Número</th><th style="padding:6px;border:1px solid #334">Alias</th><th style="padding:6px;border:1px solid #334">Estatus</th></tr></thead><tbody>${rows}</tbody></table>`,
          width: 640,
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
        });
      },
      error: (error) => {
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

  private escapeHtml(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  sinRegistro(valor: any): string {
    if (valor === null || valor === undefined || valor === '') {
      return 'Sin registro';
    }
    return valor;
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
    const nombre = rowData.nombreCompleto || rowData.numeroIdentificacion || `ID ${rowData.id}`;
    Swal.fire({
      title: 'Cancelar autoexclusión',
      html:
        `¿Cancelar la autoexclusión de <strong>${nombre}</strong>?<br><br>` +
        '<small style="color:#94a3b8">Solo aplica si ya cumplió la fecha de fin del periodo. La API devolverá error si aún está vigente. Requiere rol de Gerente según documentación.</small>',
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

  desbloquearAfiliado(rowData: any) {
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
        this.afiliadosService.updateEstatus(rowData.id, 0).subscribe({
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
