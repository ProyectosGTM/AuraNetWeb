import { Component, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { TransaccionesService } from 'src/app/shared/services/transacciones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-transacciones',
  templateUrl: './lista-transacciones.component.html',
  styleUrl: './lista-transacciones.component.scss',
  animations: [fadeInRightAnimation],
})
export class ListaTransaccionesComponent {
  public mensajeAgrupar: string = 'Arrastre un encabezado de columna aquí para agrupar por esa columna';
  public listaTransacciones: any;
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

  // Formulario para consultar saldos
  // consultarSaldoForm: FormGroup;
  // saldoData: any = null;
  // consultandoSaldo = false;
  // tipoConsulta: string = '';

  constructor(
    private transaccionesService: TransaccionesService,
    // private modalService: NgbModal,
    // private fb: FormBuilder,
  ) {
    this.showFilterRow = true;
    this.showHeaderFilter = true;
    // this.consultarSaldoForm = this.fb.group({
    //   id: ['', [Validators.required, Validators.min(1)]]
    // });
  }

  ngOnInit() {
    this.setupDataSource();
  }

  setupDataSource() {
    this.loading = true;

    this.listaTransacciones = new CustomStore({
      key: 'id',
      load: async (loadOptions: any) => {
        const take = Number(loadOptions?.take) || this.pageSize || 10;
        const skip = Number(loadOptions?.skip) || 0;
        const page = Math.floor(skip / take) + 1;

        try {
          const resp: any = await lastValueFrom(
            this.transaccionesService.obtenerMovimientosPaginados(page, take)
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

          this.totalRegistros = totalRegistros;
          this.paginaActual = paginaActual;
          this.totalPaginas = totalPaginas;
          this.paginaActualData = rows;

          return {
            data: rows,
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

  onPageIndexChanged(e: any) {
    const pageIndex = e.component.pageIndex();
    this.paginaActual = pageIndex + 1;
    e.component.refresh();
  }

  onGridOptionChanged(e: any) {
    if (e.fullName !== 'searchPanel.text') return;

    const grid = this.dataGrid?.instance;
    const texto = (e.value ?? '').toString().trim().toLowerCase();
    if (!texto) {
      this.filtroActivo = '';
      grid?.option('dataSource', this.listaTransacciones);
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
        normalizar(row?.id)
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

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatearFechaHora(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearMoneda(monto: number): string {
    if (monto === null || monto === undefined) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  obtenerValorAnidado(objeto: any, ruta: string): any {
    if (!objeto) return '';
    const partes = ruta.split('.');
    let valor = objeto;
    for (const parte of partes) {
      if (valor && valor[parte] !== undefined) {
        valor = valor[parte];
      } else {
        return '';
      }
    }
    return valor;
  }

  formatearOrigen(rowData: any): string {
    if (!rowData.origen || !rowData.origen.idContenedor) return 'Sin registro';
    const tipo = this.obtenerValorAnidado(rowData.origen, 'tipoContenedor.nombre');
    const id = rowData.origen.idContenedor;
    return tipo ? `${tipo} #${id}` : `#${id}`;
  }

  formatearDestino(rowData: any): string {
    if (!rowData.destino || !rowData.destino.idContenedor) return 'Sin registro';
    const tipo = this.obtenerValorAnidado(rowData.destino, 'tipoContenedor.nombre');
    const id = rowData.destino.idContenedor;
    return tipo ? `${tipo} #${id}` : `#${id}`;
  }

  formatearBoolean(valor: boolean | null): string {
    if (valor === null || valor === undefined) return '-';
    return valor ? 'Sí' : 'No';
  }

  // consultarSaldoMonedero(template: any) {
  //   this.tipoConsulta = 'monedero';
  //   this.saldoData = null;
  //   this.consultarSaldoForm.reset();
  //   this.modalService.open(template, { size: 'lg', backdrop: 'static', centered: true });
  // }

  // consultarSaldoCaja(template: any) {
  //   this.tipoConsulta = 'caja';
  //   this.saldoData = null;
  //   this.consultarSaldoForm.reset();
  //   this.modalService.open(template, { size: 'lg', backdrop: 'static', centered: true });
  // }

  // consultarSaldoTesoreria(template: any) {
  //   this.tipoConsulta = 'tesoreria';
  //   this.saldoData = null;
  //   this.consultarSaldoForm.reset();
  //   this.modalService.open(template, { size: 'lg', backdrop: 'static', centered: true });
  // }

  // verHistorialMonedero(id: number, template: any) {
  //   this.consultandoSaldo = true;
  //   this.saldoData = null;
  //   this.transaccionesService.obtenerHistorialMonedero(id).subscribe({
  //     next: (response) => {
  //       this.consultandoSaldo = false;
  //       this.saldoData = response;
  //       this.modalService.open(template, { size: 'xl', backdrop: 'static', centered: true });
  //     },
  //     error: (error) => {
  //       this.consultandoSaldo = false;
  //       console.error('Error al obtener historial:', error);
  //       Swal.fire({
  //         title: 'Error',
  //         html: 'No se pudo obtener el historial del monedero',
  //         icon: 'error',
  //         confirmButtonText: 'Aceptar',
  //         background: '#0d121d'
  //       });
  //     }
  //   });
  // }

  // buscarSaldo() {
  //   if (this.consultarSaldoForm.valid) {
  //     const id = this.consultarSaldoForm.value.id;
  //     this.consultandoSaldo = true;
  //     this.saldoData = null;

  //     let servicio$;
  //     switch (this.tipoConsulta) {
  //       case 'monedero':
  //         servicio$ = this.transaccionesService.obtenerSaldoMonedero(id);
  //         break;
  //       case 'caja':
  //         servicio$ = this.transaccionesService.obtenerSaldoCaja(id);
  //         break;
  //       case 'tesoreria':
  //         servicio$ = this.transaccionesService.obtenerSaldoTesoreria(id);
  //         break;
  //       default:
  //         return;
  //     }

  //     servicio$.subscribe({
  //       next: (response) => {
  //         this.consultandoSaldo = false;
  //         this.saldoData = response;
  //       },
  //       error: (error) => {
  //         this.consultandoSaldo = false;
  //         console.error('Error al obtener saldo:', error);
  //         Swal.fire({
  //           title: 'Error',
  //           html: `No se pudo obtener el saldo del ${this.tipoConsulta}`,
  //           icon: 'error',
  //           confirmButtonText: 'Aceptar',
  //           background: '#0d121d'
  //         });
  //       }
  //     });
  //   }
  // }

  // cerrarModal() {
  //   this.modalService.dismissAll();
  //   this.saldoData = null;
  //   this.consultarSaldoForm.reset();
  // }
}
