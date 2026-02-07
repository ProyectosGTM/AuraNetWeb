import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { forkJoin, lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { MonederosServices } from 'src/app/shared/services/monederos.service';
import { TurnosService } from 'src/app/shared/services/turnos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-monederos',
  templateUrl: './lista-monederos.component.html',
  styleUrl: './lista-monederos.component.scss',
  animations: [fadeInRightAnimation],
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

  @ViewChild('modalCargarMonedero', { static: false }) modalCargarMonedero!: TemplateRef<any>;
  @ViewChild('modalDescargarMonedero', { static: false }) modalDescargarMonedero!: TemplateRef<any>;
  @ViewChild('modalConsultarSaldo', { static: false }) modalConsultarSaldo!: TemplateRef<any>;
  @ViewChild('modalCambiarEstatus', { static: false }) modalCambiarEstatus!: TemplateRef<any>;
  private modalRef?: NgbModalRef;

  // Formulario para cargar monedero
  cargarMonederoForm: FormGroup;
  public listaTurnos: any[] = [];
  public listaMonederosDisponibles: any[] = [];

  // Formulario para descargar monedero
  descargarMonederoForm: FormGroup;
  public listaTurnosDescargar: any[] = [];
  public listaMonederosDisponiblesDescargar: any[] = [];

  // Formulario y datos para consultar saldo
  consultarSaldoForm: FormGroup;
  saldoData: any = null;
  consultandoSaldo = false;

  // Formulario para cambiar estatus de monedero
  cambiarEstatusForm: FormGroup;
  public listaEstatusMonederoOpciones: { id: number; text: string }[] = [];
  monederoSeleccionadoCambio: { numeroMonedero?: string; alias?: string } | null = null;

  constructor(
    private router: Router,
    private monederosService: MonederosServices,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private turnosService: TurnosService,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
    this.cargarMonederoForm = this.fb.group({
      idTurnoCaja: [null, Validators.required],
      idMonedero: [null, Validators.required],
      monto: ['', [Validators.required, Validators.min(0.01)]]
    });
    this.descargarMonederoForm = this.fb.group({
      idTurnoCaja: [null, Validators.required],
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
  }

  ngOnInit() {
    this.cargarEstatusMonedero();
    this.setupDataSource();
  }

  cargarEstatusMonedero() {
    this.monederosService.obtenerEstatusMonedero().subscribe({
      next: (response) => {
        this.listaEstatusMonedero = response?.data || [];
        this.listaEstatusMonederoOpciones = this.listaEstatusMonedero.map((e: any) => ({
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
    this.monederosService.cambiarEstatus(payload).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Operación exitosa!',
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
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.monederosService.obtenerMonederosData(page, take)
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
            const estatusMonederoColor = estatusMonedero?.color || '#6c757d';

            return {
              ...item,
              estatusTexto:
                item?.estatus === 1 ? 'Activo' :
                  item?.estatus === 0 ? 'Inactivo' : null,
              esPrincipalTexto: item?.esPrincipal === 1 ? 'Sí' : 'No',
              nombreCompletoAfiliado: `${item?.nombreAfiliado || ''} ${item?.apellidoPaternoAfiliado || ''} ${item?.apellidoMaternoAfiliado || ''}`.trim(),
              estatusMonederoTexto,
              estatusMonederoColor
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

  cargarMonedero() {
    // Cargar listas necesarias
    forkJoin({
      turnos: this.turnosService.obtenerTurnos(),
      monederos: this.monederosService.obtenerMonederos()
    }).subscribe({
      next: (responses) => {
        this.listaTurnos = (responses.turnos.data || []).map((t: any) => ({
          ...t,
          id: Number(t.id),
          text: `Turno #${t.id} - ${t.codigoCaja || ''} - ${this.formatearFechaHora(t.fechaApertura) || ''}`
        }));

        this.listaMonederosDisponibles = (responses.monederos.data || []).map((m: any) => {
          const nombreCompletoAfiliado = `${m?.nombreAfiliado || ''} ${m?.apellidoPaternoAfiliado || ''} ${m?.apellidoMaternoAfiliado || ''}`.trim() || 'Sin afiliado';
          return {
            ...m,
            id: Number(m.id),
            nombreCompletoAfiliado,
            text: `${m.numeroMonedero || ''} - ${m.alias || ''}`.trim()
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
      idTurnoCaja: this.cargarMonederoForm.value.idTurnoCaja,
      idMonedero: this.cargarMonederoForm.value.idMonedero,
      monto: Number(this.cargarMonederoForm.value.monto)
    };

    this.monederosService.cargarMonedero(payload).subscribe({
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

  descargarMonedero() {
    // Cargar listas necesarias
    forkJoin({
      turnos: this.turnosService.obtenerTurnos(),
      monederos: this.monederosService.obtenerMonederos()
    }).subscribe({
      next: (responses) => {
        this.listaTurnosDescargar = (responses.turnos.data || []).map((t: any) => ({
          ...t,
          id: Number(t.id),
          text: `Turno #${t.id} - ${t.codigoCaja || ''} - ${this.formatearFechaHora(t.fechaApertura) || ''}`
        }));

        this.listaMonederosDisponiblesDescargar = (responses.monederos.data || []).map((m: any) => {
          const nombreCompletoAfiliado = `${m?.nombreAfiliado || ''} ${m?.apellidoPaternoAfiliado || ''} ${m?.apellidoMaternoAfiliado || ''}`.trim() || 'Sin afiliado';
          return {
            ...m,
            id: Number(m.id),
            nombreCompletoAfiliado,
            text: `${m.numeroMonedero || ''} - ${m.alias || ''}`.trim()
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
    this.saldoData = null;
    this.consultarSaldoForm.reset();
    this.modalRef = this.modalService.open(this.modalConsultarSaldo, {
      size: 'lg',
      windowClass: 'modal-holder modal-consultar-saldo',
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
  }

  buscarSaldo() {
    if (this.consultarSaldoForm.invalid) {
      Swal.fire({
        title: '¡Atención!',
        text: 'Por favor ingrese el número del monedero.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Confirmar',
      });
      return;
    }

    const numero = this.consultarSaldoForm.value.numero.trim();
    this.consultandoSaldo = true;

    this.monederosService.consultarSaldoMonedero(numero).subscribe({
      next: (response) => {
        this.consultandoSaldo = false;
        this.saldoData = response;
      },
      error: (error) => {
        this.consultandoSaldo = false;
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
      idTurnoCaja: this.descargarMonederoForm.value.idTurnoCaja,
      idMonedero: this.descargarMonederoForm.value.idMonedero,
      monto: Number(this.descargarMonederoForm.value.monto)
    };

    this.monederosService.descargarMonedero(payload).subscribe({
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

  cerrarModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.cargarMonederoForm.reset();
      this.descargarMonederoForm.reset();
      this.consultarSaldoForm.reset();
      this.cambiarEstatusForm.reset();
      this.saldoData = null;
      this.consultandoSaldo = false;
      this.monederoSeleccionadoCambio = null;
    }
  }
}
