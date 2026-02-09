import { HttpClient } from '@angular/common/http';
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

  obtenerResumenTurno(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/resumen/${id}`);
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

  obtenerEstatusTurno(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatusturno/list`);
  }
}