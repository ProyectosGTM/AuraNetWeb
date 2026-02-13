import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  constructor(private http: HttpClient) { }

  obtenerTurnosData(page: number, limit: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/paginado/${page}/${limit}`);
  }

  obtenerTurnos(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/list`);
  }

  /** GET /pos/turnos/mi-turno/activo - Obtener turno activo del cajero */
  obtenerMiTurnoActivo(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/mi-turno/activo`);
  }

  /** GET /pos/turnos/activos - Obtener turnos activos */
  obtenerTurnosActivos(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/activos`);
  }

  /** GET /pos/turnos/resumen/saldos/{id} - Obtener resumen del turno con saldos */
  obtenerResumenTurno(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/resumen/saldos/${id}`);
  }

  /** GET /pos/turnos/movimientos/{id} - Obtener movimientos del turno */
  obtenerMovimientosTurno(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/movimientos/${id}`);
  }

  /** GET /pos/turnos/consulta/filtrada - Listar turnos con filtros (query params opcionales) */
  obtenerTurnosConsultaFiltrada(params?: { [key: string]: string | number | boolean }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/consulta/filtrada`, { params: httpParams });
  }

  obtenerTurnoPorId(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/${id}`);
  }

  abrirTurno(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/turnos/abrir`, data);
  }

  cerrarTurno(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/turnos/cerrar`, data);
  }

  /** POST /pos/turnos/reponer - Reponer efectivo (Tesorería -> Caja) durante turno activo */
  reponerTurno(data: { idCaja: number; monto: number; motivo: string }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/turnos/reponer`, data);
  }

  /** POST /pos/turnos/retirar - Retiro parcial (Caja -> Tesorería) durante turno activo */
  retirarTurno(data: { idCaja: number; monto: number; motivo: string }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/turnos/retirar`, data);
  }

  /** POST /pos/turnos/suspender - Suspender turno temporalmente (pausa sin cerrar) */
  suspenderTurno(data: { idCaja: number; motivo: string; efectivoContado: number }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/turnos/suspender`, data);
  }

  /** POST /pos/turnos/reactivar - Reactivar turno suspendido */
  reactivarTurno(data: { idTurno: number; motivo?: string }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/turnos/reactivar`, data);
  }

  /** POST /pos/turnos/corte-parcial - Corte parcial (Corte X) */
  corteParcial(data: { idTurno: number; monto: number; motivo?: string }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/turnos/corte-parcial`, data);
  }

  obtenerEstatusTurno(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatusturno/list`);
  }
}