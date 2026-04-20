/** Contrato flexible POST /dashboard/kpis y respuesta KPI casino. */

export interface DashboardKpisRequest {
  fechaInicio: string;
  fechaFin: string;
  filtro: number;
  idCliente: number;
}

export interface DashboardKpisPeriodo {
  fechaInicio?: string;
  fechaFin?: string;
  filtroAplicado?: number;
  granularidad?: string;
}

export interface DashboardKpisAlcance {
  clienteBase?: number;
  clientesIncluidos?: number[];
}

export interface DashboardKpisMetricas {
  ggr?: number;
  ngr?: number;
  totalApuestas?: number;
  totalGanancias?: number;
  totalBonos?: number;
  bonusToGgrPorcentaje?: number;
  jugadoresActivos?: number;
  nuevosAfiliados?: number;
  totalSesiones?: number;
  duracionPromedioSesionMin?: number;
  arpu?: number;
  dauPromedio?: number;
  dauMaximo?: number;
  totalDepositos?: number;
  totalRetiros?: number;
  netCashFlow?: number;
}

export interface DashboardKpisResponse {
  periodo?: DashboardKpisPeriodo;
  alcance?: DashboardKpisAlcance;
  kpis?: DashboardKpisMetricas;
  tendencias?: { ingresos?: Record<string, unknown>[] };
  ranking?: { top5MaquinasPorApuestas?: Record<string, unknown>[] };
  promociones?: { porEstatus?: Record<string, unknown>[] };
}
