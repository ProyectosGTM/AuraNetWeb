import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { lastValueFrom } from 'rxjs';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { PromocionesService } from 'src/app/shared/services/promociones.service';
import Swal from 'sweetalert2';

/** Pestañas del panel de consultas (agrupación funcional). */
export type TabAccionesPromo = 'catalogo' | 'estado' | 'conversion' | 'reportes' | 'relacion';

const promoTabPanelAnimation = trigger('promoTabPanel', [
  transition('* => *', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('260ms cubic-bezier(0.33, 1, 0.68, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

/** Vistas de solo lectura (GET) agrupadas en un solo módulo. */
export type VistaPromociones =
  | 'todas'
  | 'vigentes'
  | 'por_vencer'
  | 'pendientes'
  | 'reporte'
  | 'por_afiliado'
  | 'por_monedero'
  | 'rollover_estado'
  | 'rollover_historial'
  | 'cron_expirar'
  | 'detalle';

@Component({
  selector: 'app-lista-promociones',
  templateUrl: './lista-promociones.component.html',
  styleUrl: './lista-promociones.component.scss',
  animations: [fadeInRightAnimation, promoTabPanelAnimation],
})
export class ListaPromocionesComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) dataGrid?: DxDataGridComponent;

  readonly mensajeAgrupar =
    'Arrastre un encabezado de columna aquí para agrupar por esa columna';

  vista: VistaPromociones = 'todas';
  /** Pestaña visible del panel de consultas (por defecto listado general). */
  tabAcciones: TabAccionesPromo = 'catalogo';
  listaPromociones: CustomStore;
  /** Siempre 20 filas por página en el grid. */
  readonly pageSize = 20;

  readonly dxPagerOptions = {
    showPageSizeSelector: false,
    allowedPageSizes: [20] as number[],
    showInfo: true,
    infoText: 'Página {0} de {1}',
    visible: true,
  };
  showFilterRow = true;
  showHeaderFilter = true;
  loading = false;

  /** Modo columnas: promoción estándar | clave-valor (objetos / reporte) */
  modoColumnas: 'promo' | 'kv' = 'promo';

  /** Detalle GET /promociones/{id} */
  idDetalle: number | null = null;
  promocionDetalle: any = null;
  loadingDetalle = false;
  errorDetalle: string | null = null;

  /** Payload no tabular (cron, reporte objeto, etc.) */
  payloadJson: string | null = null;

  formParam: FormGroup;
  formReporte: FormGroup;

  constructor(
    private fb: FormBuilder,
    private promocionesService: PromocionesService
  ) {
    this.formParam = this.fb.group({
      id: [''],
    });
    this.formReporte = this.fb.group({
      fechaDesde: [''],
      fechaHasta: [''],
    });
    this.listaPromociones = new CustomStore({
      key: 'id',
      load: (opts) => this.cargarStore(opts),
    });
  }

  ngOnInit(): void {
    this.refrescarGrid();
  }

  claseActivaCard(v: VistaPromociones): boolean {
    return this.vista === v && this.vista !== 'detalle';
  }

  /** Etiqueta corta para la tarjeta superior (mismo patrón que Turnos activos). */
  etiquetaVistaActual(): string {
    const m: Record<Exclude<VistaPromociones, 'detalle'>, string> = {
      todas: 'Catálogo completo',
      vigentes: 'Vigentes',
      por_vencer: 'Por vencer',
      pendientes: 'Pendientes conversión',
      reporte: 'Reporte',
      por_afiliado: 'Por afiliado',
      por_monedero: 'Por monedero',
      rollover_estado: 'Rollover',
      rollover_historial: 'Hist. rollover',
      cron_expirar: 'Cron expirar',
    };
    return m[this.vista as keyof typeof m] ?? '';
  }

  mensajeTarjetaContexto(): string {
    if (this.vista === 'cron_expirar') {
      return 'La respuesta de expiración se muestra debajo, en formato JSON.';
    }
    return 'El listado inferior refleja la vista elegida. Use las pestañas y las tarjetas de consulta.';
  }

  setTabAcciones(tab: TabAccionesPromo): void {
    this.tabAcciones = tab;
  }

  esTabAcciones(tab: TabAccionesPromo): boolean {
    return this.tabAcciones === tab;
  }

  /** Mantiene la pestaña alineada con la vista activa (p. ej. al elegir una tarjeta). */
  private syncTabDesdeVista(): void {
    const v = this.vista;
    if (v === 'detalle') return;
    if (v === 'todas') {
      this.tabAcciones = 'catalogo';
      return;
    }
    if (v === 'vigentes' || v === 'por_vencer' || v === 'rollover_estado' || v === 'cron_expirar') {
      this.tabAcciones = 'estado';
      return;
    }
    if (v === 'pendientes' || v === 'rollover_historial') {
      this.tabAcciones = 'conversion';
      return;
    }
    if (v === 'reporte') {
      this.tabAcciones = 'reportes';
      return;
    }
    if (v === 'por_afiliado' || v === 'por_monedero') {
      this.tabAcciones = 'relacion';
    }
  }

  setVista(v: VistaPromociones): void {
    if (v === 'detalle') return;
    this.vista = v;
    this.modoColumnas = 'promo';
    this.payloadJson = null;
    this.promocionDetalle = null;
    this.idDetalle = null;
    this.errorDetalle = null;
    if (this.necesitaParametro()) {
      this.formParam.reset({ id: '' });
    }
    this.syncTabDesdeVista();
    if (v === 'cron_expirar') {
      this.ejecutarCronExpirar();
      return;
    }
    this.refrescarGrid();
  }

  necesitaParametro(): boolean {
    return (
      this.vista === 'por_afiliado' ||
      this.vista === 'por_monedero' ||
      this.vista === 'rollover_estado' ||
      this.vista === 'rollover_historial'
    );
  }

  etiquetaParametro(): string {
    switch (this.vista) {
      case 'por_afiliado':
        return 'ID afiliado';
      case 'por_monedero':
        return 'ID monedero';
      case 'rollover_estado':
      case 'rollover_historial':
        return 'ID promoción';
      default:
        return 'ID';
    }
  }

  consultarConParametro(): void {
    const raw = String(this.formParam.get('id')?.value ?? '').trim();
    const id = Number(raw);
    if (!Number.isFinite(id) || id < 1) {
      Swal.fire({
        title: 'Atención',
        text: 'Ingresa un identificador numérico válido.',
        icon: 'warning',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    this.refrescarGrid();
  }

  consultarReporte(): void {
    this.refrescarGrid();
  }

  volverListado(): void {
    this.promocionDetalle = null;
    this.idDetalle = null;
    this.errorDetalle = null;
    this.vista = 'todas';
    this.modoColumnas = 'promo';
    this.payloadJson = null;
    this.syncTabDesdeVista();
    this.refrescarGrid();
  }

  verDetallePromocion(id: number): void {
    this.vista = 'detalle';
    this.idDetalle = id;
    this.cargarDetalle();
  }

  irRolloverDesdeDetalle(): void {
    if (this.idDetalle == null) return;
    this.formParam.patchValue({ id: String(this.idDetalle) });
    this.vista = 'rollover_estado';
    this.syncTabDesdeVista();
    this.refrescarGrid();
  }

  private cargarDetalle(): void {
    if (this.idDetalle == null) return;
    this.loadingDetalle = true;
    this.errorDetalle = null;
    this.promocionDetalle = null;
    this.promocionesService.obtenerPorId(this.idDetalle).subscribe({
      next: (r) => {
        this.loadingDetalle = false;
        this.promocionDetalle = r?.data ?? r ?? null;
      },
      error: (e) => {
        this.loadingDetalle = false;
        this.errorDetalle = e?.error?.message || e?.message || 'Error al cargar la promoción';
      },
    });
  }

  private ejecutarCronExpirar(): void {
    this.loading = true;
    this.payloadJson = null;
    this.promocionesService.cronExpirar().subscribe({
      next: (r) => {
        this.loading = false;
        const body = r?.data ?? r;
        this.payloadJson = JSON.stringify(body, null, 2);
      },
      error: (e) => {
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: e?.error?.message || 'Error al ejecutar la consulta.',
          icon: 'error',
          background: '#0d121d',
          confirmButtonColor: '#3085d6',
        });
      },
    });
  }

  refrescarGrid(): void {
    this.dataGrid?.instance?.refresh();
  }

  limpiarFiltrosGrid(): void {
    this.dataGrid?.instance?.clearFilter();
    this.dataGrid?.instance?.clearSorting();
    this.dataGrid?.instance?.option('searchPanel.text', '');
    this.refrescarGrid();
  }

  toggleExpandGroups(): void {
    const inst = this.dataGrid?.instance;
    if (!inst) return;
    const expanded = inst.option('grouping.autoExpandAll');
    inst.option('grouping.autoExpandAll', !expanded);
  }

  formatearFecha(f: string | null): string {
    if (!f) return 'Sin registro';
    try {
      const d = new Date(f);
      if (isNaN(d.getTime())) return 'Sin registro';
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return 'Sin registro';
    }
  }

  private async cargarStore(opts: any): Promise<{ data: any[]; totalCount: number }> {
    if (this.vista === 'detalle' || this.vista === 'cron_expirar') {
      return { data: [], totalCount: 0 };
    }

    if (this.necesitaParametro()) {
      const raw = String(this.formParam.get('id')?.value ?? '').trim();
      const id = Number(raw);
      if (!Number.isFinite(id) || id < 1) {
        return { data: [], totalCount: 0 };
      }
    }

    this.loading = true;
    try {
      let resp: any;
      switch (this.vista) {
        case 'todas':
          resp = await lastValueFrom(this.promocionesService.listar());
          this.modoColumnas = 'promo';
          break;
        case 'vigentes':
          resp = await lastValueFrom(this.promocionesService.vigentes());
          this.modoColumnas = 'promo';
          break;
        case 'por_vencer':
          resp = await lastValueFrom(this.promocionesService.porVencer());
          this.modoColumnas = 'promo';
          break;
        case 'pendientes':
          resp = await lastValueFrom(this.promocionesService.pendientesConversion());
          this.modoColumnas = 'promo';
          break;
        case 'reporte': {
          const fd = this.formReporte.get('fechaDesde')?.value;
          const fh = this.formReporte.get('fechaHasta')?.value;
          const params: Record<string, string | number> = {};
          if (fd) params['fechaDesde'] = String(fd);
          if (fh) params['fechaHasta'] = String(fh);
          resp = await lastValueFrom(this.promocionesService.reporte(params));
          const data = resp?.data ?? resp;
          if (Array.isArray(data)) {
            this.modoColumnas = 'promo';
          } else if (data && typeof data === 'object') {
            this.modoColumnas = 'kv';
            this.payloadJson = null;
          } else {
            this.modoColumnas = 'promo';
          }
          break;
        }
        case 'por_afiliado': {
          const idA = Number(this.formParam.get('id')?.value);
          resp = await lastValueFrom(this.promocionesService.porAfiliado(idA));
          this.modoColumnas = 'promo';
          break;
        }
        case 'por_monedero': {
          const idM = Number(this.formParam.get('id')?.value);
          resp = await lastValueFrom(this.promocionesService.porMonedero(idM));
          this.modoColumnas = 'promo';
          break;
        }
        case 'rollover_estado': {
          const idP = Number(this.formParam.get('id')?.value);
          resp = await lastValueFrom(this.promocionesService.rollover(idP));
          const data = resp?.data ?? resp;
          if (Array.isArray(data)) {
            this.modoColumnas = 'promo';
          } else {
            this.modoColumnas = 'kv';
          }
          break;
        }
        case 'rollover_historial': {
          const idH = Number(this.formParam.get('id')?.value);
          resp = await lastValueFrom(this.promocionesService.rolloverHistorial(idH));
          this.modoColumnas = 'promo';
          break;
        }
        default:
          this.loading = false;
          return { data: [], totalCount: 0 };
      }

      this.loading = false;
      const data = resp?.data ?? resp;

      if (this.vista === 'reporte' && this.modoColumnas === 'kv') {
        const kv = this.toKvRows(data);
        const skip = opts?.skip ?? 0;
        const take = this.pageSize;
        const page = kv.slice(skip, skip + take);
        return { data: page, totalCount: kv.length };
      }

      if (this.vista === 'rollover_estado' && this.modoColumnas === 'kv') {
        const kv = this.toKvRows(data);
        const skip = opts?.skip ?? 0;
        const take = this.pageSize;
        const page = kv.slice(skip, skip + take);
        return { data: page, totalCount: kv.length };
      }

      const list = Array.isArray(data) ? data : data ? [data] : [];
      const mapped = list.map((item: any) => ({
        ...item,
        fechaInicioFormateada: this.formatearFecha(item?.fechaInicio),
        fechaFinFormateada: this.formatearFecha(item?.fechaFin),
        id: item?.id != null ? Number(item.id) : undefined,
      }));
      const withIds = mapped.map((row: any, idx: number) => ({
        ...row,
        id: row.id != null && !isNaN(row.id) ? row.id : idx + 1,
      }));
      const skip = opts?.skip ?? 0;
      const take = this.pageSize;
      const page = withIds.slice(skip, skip + take);
      return { data: page, totalCount: withIds.length };
    } catch (e: any) {
      this.loading = false;
      Swal.fire({
        title: 'Error',
        text: e?.error?.message || e?.message || 'Error al cargar datos.',
        icon: 'error',
        background: '#0d121d',
        confirmButtonColor: '#3085d6',
      });
      return { data: [], totalCount: 0 };
    }
  }

  private toKvRows(obj: any): { id: number; campo: string; valor: string }[] {
    if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
      return [];
    }
    let i = 0;
    const out: { id: number; campo: string; valor: string }[] = [];
    for (const k of Object.keys(obj)) {
      i += 1;
      const v = obj[k];
      const valor =
        v !== null && typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
      out.push({ id: i, campo: k, valor });
    }
    return out;
  }
}
