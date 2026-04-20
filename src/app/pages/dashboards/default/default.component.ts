import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { fadeInRightAnimation } from 'src/app/core/fade-in-right.animation';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/entities/User';
import { ClientesService } from 'src/app/shared/services/clientes.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import Swal from 'sweetalert2';
import { DashboardKpisRequest, DashboardKpisResponse } from './dashboard-kpis.model';

type ClienteOption = { id: number; text: string };

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss'],
  animations: [fadeInRightAnimation],
})
export class DefaultComponent implements OnInit {
  loading = false;
  lastUpdated: Date | null = null;
  data: DashboardKpisResponse | null = null;

  filterForm: FormGroup;
  listaClientes: ClienteOption[] = [];

  /** Se envía al API; no se muestra en pantalla. Atajos de fecha lo ajustan; al editar fechas manualmente vuelve a 0. */
  private filtroApi = 0;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly auth: AuthenticationService,
    private readonly clientesService: ClientesService,
    private readonly fb: FormBuilder,
  ) {
    const semana = this.rangoSemanaActual();
    const idDef = this.resolverIdCliente();
    this.listaClientes = [{ id: idDef, text: 'Cliente actual' }];
    this.filtroApi = 2;
    this.filterForm = this.fb.group({
      fechaInicio: [semana.inicio],
      fechaFin: [semana.fin],
      idCliente: [idDef],
    });
  }

  ngOnInit(): void {
    this.filterForm.get('fechaInicio')?.valueChanges.subscribe(() => {
      this.filtroApi = 0;
    });
    this.filterForm.get('fechaFin')?.valueChanges.subscribe(() => {
      this.filtroApi = 0;
    });
    this.cargarClientes();
    this.cargarKpis();
  }

  cargarClientes(): void {
    this.clientesService.obtenerClientes().subscribe({
      next: (response) => {
        const mapped = (response?.data || [])
          .map((c: Record<string, unknown>) => ({
            id: Number(c['id'] ?? c['Id'] ?? 0),
            text: String(c['nombre'] ?? c['nombreComercial'] ?? '').trim() || `Cliente ${c['id']}`,
          }))
          .filter((c: ClienteOption) => c.id > 0);
        const cur = Number(this.filterForm.get('idCliente')?.value);
        if (cur > 0 && !mapped.some((c) => c.id === cur)) {
          mapped.unshift({ id: cur, text: `Cliente ${cur}` });
        }
        this.listaClientes = mapped.length ? mapped : [{ id: this.resolverIdCliente(), text: 'Cliente actual' }];
      },
      error: () => {
        const idDef = this.resolverIdCliente();
        this.listaClientes = [{ id: idDef, text: 'Cliente actual' }];
      },
    });
  }

  resolverIdCliente(): number {
    try {
      const u = this.auth.getUser() as User | null;
      if (!u) return 1;
      const nested = u.user as { idCliente?: unknown } | undefined;
      const raw = u.idCliente ?? nested?.idCliente;
      if (raw != null && raw !== '') {
        const n = Number(raw);
        if (!Number.isNaN(n) && n > 0) return n;
      }
    } catch {
      /* Sin sesión o user inválido */
    }
    return 1;
  }

  rangoSemanaActual(): { inicio: string; fin: string } {
    const ahora = new Date();
    const dia = ahora.getDay();
    const offsetLunes = dia === 0 ? -6 : 1 - dia;
    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() + offsetLunes);
    lunes.setHours(0, 0, 0, 0);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    return { inicio: this.toYmd(lunes), fin: this.toYmd(domingo) };
  }

  toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  presetSemanaActual(): void {
    const s = this.rangoSemanaActual();
    this.filtroApi = 2;
    this.filterForm.patchValue({ fechaInicio: s.inicio, fechaFin: s.fin }, { emitEvent: false });
    this.cargarKpis();
  }

  presetHoy(): void {
    const d = new Date();
    const ymd = this.toYmd(d);
    this.filtroApi = 1;
    this.filterForm.patchValue({ fechaInicio: ymd, fechaFin: ymd }, { emitEvent: false });
    this.cargarKpis();
  }

  presetMesActual(): void {
    const d = new Date();
    const ini = new Date(d.getFullYear(), d.getMonth(), 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    this.filtroApi = 3;
    this.filterForm.patchValue({ fechaInicio: this.toYmd(ini), fechaFin: this.toYmd(fin) }, { emitEvent: false });
    this.cargarKpis();
  }

  cargarKpis(): void {
    const v = this.filterForm.getRawValue();
    const body: DashboardKpisRequest = {
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      filtro: this.filtroApi,
      idCliente: Number(v.idCliente),
    };

    this.loading = true;
    this.dashboardService.postKpis(body).subscribe({
      next: (resp) => {
        const payload = (resp && (resp as { data?: DashboardKpisResponse }).data)
          ? (resp as { data: DashboardKpisResponse }).data
          : (resp as DashboardKpisResponse);
        this.data = payload ?? null;
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || err?.message || 'No se pudieron cargar los datos del tablero.';
        Swal.fire({
          title: 'Error',
          text: msg,
          icon: 'error',
          background: '#0d121d',
          color: '#fff',
          confirmButtonColor: '#e40041',
        });
      },
    });
  }

  etiquetaGranularidad(): string {
    const g = this.data?.periodo?.granularidad;
    if (!g) return '—';
    return g.charAt(0).toUpperCase() + g.slice(1);
  }

  get serieIngresos(): { periodo: string; valor: number }[] {
    const raw = this.data?.tendencias?.ingresos ?? [];
    return raw.map((row: Record<string, unknown>, i: number) => {
      const periodo = String(
        row['periodo'] ?? row['fecha'] ?? row['mes'] ?? row['etiqueta'] ?? row['label'] ?? `P${i + 1}`,
      );
      const valor = Number(row['valor'] ?? row['monto'] ?? row['ingreso'] ?? row['total'] ?? 0);
      return { periodo, valor: Number.isFinite(valor) ? valor : 0 };
    });
  }

  formatearMoneda(valor: number | null | undefined): string {
    const n = Number(valor ?? 0);
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });
  }

  formatearNumero(valor: number | null | undefined): string {
    return Number(valor ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 });
  }

  formatearEntero(valor: number | null | undefined): string {
    return Math.round(Number(valor ?? 0)).toLocaleString('es-MX');
  }

  formatearHoraActualizacion(): string {
    if (!this.lastUpdated) return '';
    return this.lastUpdated.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  textoFilaGenerica(row: Record<string, unknown>): string {
    const nombre =
      row['nombre'] ??
      row['nombreMaquina'] ??
      row['maquina'] ??
      row['descripcion'] ??
      row['estatus'] ??
      row['nombreEstatus'] ??
      '—';
    const extra = row['totalApuestas'] ?? row['apuestas'] ?? row['cantidad'] ?? row['total'] ?? '';
    const extraStr = extra !== '' && extra != null ? ` · ${extra}` : '';
    return `${String(nombre)}${extraStr}`;
  }
}
