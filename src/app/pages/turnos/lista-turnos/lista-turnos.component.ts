import { Component, HostListener, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { forkJoin, lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { CajasService } from 'src/app/shared/services/cajas.service';
import { TesoreriaService } from 'src/app/shared/services/tesoreria.service';
import { TurnosService } from 'src/app/shared/services/turnos.service';
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
  private modalRef?: NgbModalRef;

  // Formulario para abrir turno
  abrirTurnoForm: FormGroup;
  public listaCajas: any[] = [];
  public listaTesoreria: any[] = [];
  public listaEstatusTurno: SelectItem[] = [];

  // Formulario para cerrar turno
  cerrarTurnoForm: FormGroup;
  public listaTurnosActivos: any[] = [];

  // Estados para selects abrir turno
  isCajaOpen = false;
  cajaLabel = '';
  isTesoreriaOpen = false;
  tesoreriaLabel = '';
  isEstatusTurnoOpen = false;
  estatusTurnoLabel = '';

  // Estados para selects cerrar turno
  isTurnoActivoOpen = false;
  turnoActivoLabel = '';

  constructor(
    private router: Router,
    private turnosService: TurnosService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private cajasService: CajasService,
    private tesoreriaService: TesoreriaService,
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
  }

  ngOnInit() {
    this.setupDataSource();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    // Si el click NO fue dentro de un select custom, cierra todos
    if (!target.closest('.select-sleek')) {
      this.closeSelects();
    }
  }

  private closeSelects() {
    this.isCajaOpen = false;
    this.isTesoreriaOpen = false;
    this.isEstatusTurnoOpen = false;
    this.isTurnoActivoOpen = false;
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
      this.filtroActivo = '';
      this.setupDataSource();
      this.dataGrid.instance.refresh();
    }
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
          const resp: any = await lastValueFrom(
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
        this.listaCajas = (responses.cajas.data || []).map((c: any) => ({
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

  toggleCaja(event: any) {
    event.stopPropagation();
    this.isCajaOpen = !this.isCajaOpen;
  }

  setCaja(id: number, label: string, event: any) {
    event.stopPropagation();
    this.abrirTurnoForm.patchValue({ idCaja: id });
    this.cajaLabel = label;
    this.isCajaOpen = false;
  }

  toggleTesoreria(event: any) {
    event.stopPropagation();
    this.isTesoreriaOpen = !this.isTesoreriaOpen;
  }

  setTesoreria(id: number, label: string, event: any) {
    event.stopPropagation();
    this.abrirTurnoForm.patchValue({ idTesoreria: id });
    this.tesoreriaLabel = label;
    this.isTesoreriaOpen = false;
  }

  toggleEstatusTurno(event: any) {
    event.stopPropagation();
    this.isEstatusTurnoOpen = !this.isEstatusTurnoOpen;
  }

  setEstatusTurno(id: number, label: string, event: any) {
    event.stopPropagation();
    this.abrirTurnoForm.patchValue({ idEstatusTurno: id });
    this.estatusTurnoLabel = label;
    this.isEstatusTurnoOpen = false;
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
        this.cajaLabel = '';
        this.tesoreriaLabel = '';
        this.estatusTurnoLabel = '';
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

  toggleTurnoActivo(event: any) {
    event.stopPropagation();
    this.isTurnoActivoOpen = !this.isTurnoActivoOpen;
  }

  setTurnoActivo(id: number, label: string, event: any) {
    event.stopPropagation();
    this.cerrarTurnoForm.patchValue({ idTurno: id });
    this.turnoActivoLabel = label;
    this.isTurnoActivoOpen = false;
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
        this.turnoActivoLabel = '';
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

  cerrarModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.abrirTurnoForm.reset();
      this.cerrarTurnoForm.reset();
      this.cajaLabel = '';
      this.tesoreriaLabel = '';
      this.turnoActivoLabel = '';
      this.isCajaOpen = false;
      this.isTesoreriaOpen = false;
      this.isTurnoActivoOpen = false;
    }
  }
}
