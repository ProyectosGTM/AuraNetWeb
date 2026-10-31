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
        this.animarContadores();
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

  get serieIngresos(): { periodo: string; valor: number; apuestas: number; ganancias: number }[] {
    const raw = this.data?.tendencias?.ingresos ?? [];
    const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    return raw.map((row: Record<string, unknown>, i: number) => {
      const periodo = String(
        row['periodo'] ?? row['fecha'] ?? row['mes'] ?? row['etiqueta'] ?? row['label'] ?? `P${i + 1}`,
      );
      const valor = num(row['ggr'] ?? row['valor'] ?? row['monto'] ?? row['ingreso'] ?? row['total']);
      return { periodo, valor, apuestas: num(row['totalApuestas']), ganancias: num(row['totalGanancias']) };
    });
  }

  /** Nombre del usuario en sesión para el saludo. */
  get nombreUsuario(): string {
    const u = this.auth.getUser() as User | null;
    return (u?.nombre ?? '').toString().trim() || 'Bienvenido';
  }

  get saludo(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  }

  get fechaHoyLarga(): string {
    const s = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /** % de lo apostado que se devolvió en premios (payout). */
  get payoutPct(): number {
    const ap = Number(this.data?.kpis?.totalApuestas ?? 0);
    const ga = Number(this.data?.kpis?.totalGanancias ?? 0);
    return ap > 0 ? Math.min(100, (ga / ap) * 100) : 0;
  }

  /** Participación de depósitos frente a retiros (0–100). */
  get pctDepositos(): number {
    const d = Number(this.data?.kpis?.totalDepositos ?? 0);
    const r = Number(this.data?.kpis?.totalRetiros ?? 0);
    return d + r > 0 ? (d / (d + r)) * 100 : 50;
  }

  get rankingMaquinas(): { nombre: string; apuestas: number; ggr: number; sesiones: number; pct: number }[] {
    const rows = this.data?.ranking?.top5MaquinasPorApuestas ?? [];
    const lista = rows.map((r: Record<string, unknown>) => ({
      nombre: String(r['maquina'] ?? r['nombre'] ?? r['nombreMaquina'] ?? 'Máquina'),
      apuestas: Number(r['totalApuestas'] ?? 0),
      ggr: Number(r['ggr'] ?? 0),
      sesiones: Number(r['sesiones'] ?? 0),
      pct: 0,
    }));
    const max = Math.max(1, ...lista.map((x) => x.apuestas));
    lista.forEach((x) => (x.pct = (x.apuestas / max) * 100));
    return lista;
  }

  get promocionesEstatus(): { nombre: string; color: string; cantidad: number; monto: number; pct: number }[] {
    const catalogo: Record<number, { nombre: string; color: string }> = {
      1: { nombre: 'Activas', color: '#34d399' },
      2: { nombre: 'Completadas', color: '#6a8cff' },
      3: { nombre: 'Expiradas', color: '#ffc94d' },
      4: { nombre: 'Canceladas', color: '#ff1a5b' },
      5: { nombre: 'Pendientes', color: '#a78bfa' },
    };
    const rows = this.data?.promociones?.porEstatus ?? [];
    const lista = rows.map((r: Record<string, unknown>) => {
      const id = Number(r['idEstatusPromocion'] ?? 0);
      const cat = catalogo[id] ?? { nombre: `Estatus ${id}`, color: '#94a3b8' };
      return { ...cat, cantidad: Number(r['cantidad'] ?? 0), monto: Number(r['montoBono'] ?? 0), pct: 0 };
    });
    const total = lista.reduce((s, x) => s + x.cantidad, 0) || 1;
    lista.forEach((x) => (x.pct = (x.cantidad / total) * 100));
    return lista;
  }

  readonly paletaGrafica = ['#e40041', '#6a8cff', '#ffc94d'];

  /** Valores mostrados con efecto de contador tipo jackpot. */
  anim: Record<string, number> = {};
  private animFrame?: number;

  private animarContadores(): void {
    const k = this.data?.kpis ?? {};
    const destino: Record<string, number> = {
      ggr: Number(k.ggr ?? 0),
      ngr: Number(k.ngr ?? 0),
      netCashFlow: Number(k.netCashFlow ?? 0),
      jugadoresActivos: Number(k.jugadoresActivos ?? 0),
      totalBonos: Number(k.totalBonos ?? 0),
      totalSesiones: Number(k.totalSesiones ?? 0),
    };
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    const inicio = performance.now();
    const duracion = 1400;
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracion);
      const e = 1 - Math.pow(1 - p, 3);
      Object.keys(destino).forEach((key) => (this.anim[key] = destino[key] * e));
      if (p < 1) this.animFrame = requestAnimationFrame(paso);
    };
    this.animFrame = requestAnimationFrame(paso);
  }

  /** Dona de promociones (conic-gradient) a partir del estatus. */
  get donaPromociones(): string {
    const lista = this.promocionesEstatus;
    if (!lista.length) return 'conic-gradient(rgba(255,255,255,.08) 0 100%)';
    let acc = 0;
    const tramos = lista.map((p) => {
      const desde = acc;
      acc += p.pct;
      return `${p.color} ${desde}% ${acc}%`;
    });
    return `conic-gradient(${tramos.join(', ')})`;
  }

  get totalPromociones(): number {
    return this.promocionesEstatus.reduce((s, p) => s + p.cantidad, 0);
  }

  /** Elementos de la cinta tipo marquesina LED. */
  get cintaIndicadores(): { icono: string; texto: string; valor: string }[] {
    const k = this.data?.kpis ?? {};
    return [
      { icono: 'fa-coins', texto: 'Apuestas', valor: this.formatearMoneda(k.totalApuestas) },
      { icono: 'fa-trophy', texto: 'Premios pagados', valor: this.formatearMoneda(k.totalGanancias) },
      { icono: 'fa-gift', texto: 'Bonos', valor: this.formatearMoneda(k.totalBonos) },
      { icono: 'fa-gamepad', texto: 'Sesiones', valor: this.formatearEntero(k.totalSesiones) },
      { icono: 'fa-user-plus', texto: 'Nuevos afiliados', valor: this.formatearEntero(k.nuevosAfiliados) },
      { icono: 'fa-arrow-down', texto: 'Depósitos', valor: this.formatearMoneda(k.totalDepositos) },
      { icono: 'fa-arrow-up', texto: 'Retiros', valor: this.formatearMoneda(k.totalRetiros) },
    ];
  }

  /** Podio en orden visual 2-1-3 para las tres primeras máquinas. */
  get podio(): { pos: number; m: { nombre: string; apuestas: number; ggr: number; sesiones: number; pct: number } }[] {
    const r = this.rankingMaquinas;
    return [1, 0, 2].filter((i) => r[i]).map((i) => ({ pos: i + 1, m: r[i] }));
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
