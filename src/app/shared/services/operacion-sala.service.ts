import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardSala {
  idSala: number;
  turnosAbiertos: {
    idTurno: number; idCaja: number; caja: string; idCajero: number; cajero: string;
    suspendido: boolean; saldoCentavos: number; ledgerCentavos: number; cuadra: boolean;
  }[];
  efectivoEnCajasCentavos: number;
  tesorerias: { idTesoreria: number; saldoCentavos: number; ledgerCentavos: number; cuadra: boolean }[];
  efectivoEnTesoreriaCentavos: number;
  sesionesAbiertas: {
    idSesion: number; idMaquina: number; maquina: string; estado: string;
    montoInicialCentavos: number; fechaInicio: string;
  }[];
  retenidoEnMaquinasCentavos: number;
  maquinasEnJuego: number;
  sesionesEnRevision: number;
  maquinasSinComunicacion: { idMaquina: number; ultimoLatido: string }[];
  cuadra: boolean;
}

/** Dashboard de sala y cierre manual de sesiones de juego (ESPECIFICACION_FRONT §10). */
@Injectable({ providedIn: 'root' })
export class OperacionSalaService {
  constructor(private http: HttpClient) { }

  /** GET /dashboard/sala — Gerente y Jefe de Sala. Montos en centavos. */
  obtenerDashboardSala(): Observable<DashboardSala> {
    return this.http.get<DashboardSala>(`${environment.API_SECURITY}/dashboard/sala`);
  }

  /** POST /sesiones-juego/:id/cierre-manual — Gerente, con Idempotency-Key (la agrega el interceptor). */
  cierreManualSesion(idSesion: number, body: { motivo: string; montoRetiradoCentavos: number }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/sesiones-juego/${idSesion}/cierre-manual`, body);
  }
}
