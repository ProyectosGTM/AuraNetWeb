import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TesoreriaService {

  constructor(private http: HttpClient) { }

  obtenerTesoreriaData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/tesorerias/${page}/${pageSize}`);
  }

  obtenerTesoreria(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/tesorerias/list`);
  }

  agregarTesoreria(data: any) {
    return this.http.post(environment.API_SECURITY + '/tesorerias', data);
  }

  eliminarTesoreria(idTesoreria: Number) {
    return this.http.delete(environment.API_SECURITY + '/tesorerias/' + idTesoreria);
  }

  obtenerTesoreriaPorId(idTesoreria: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/tesorerias/' + idTesoreria);
  }

  actualizarTesoreria(idTesoreria: number, saveForm: any): Observable<any> {
    return this.http.patch(`${environment.API_SECURITY}/tesorerias/` + idTesoreria, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/tesorerias`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerSalas(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/salas/list`);
  }

  obtenerEstatusTesoreria(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatustesoreria/list`);
  }

  obtenerTesoreriaAbiertaPorSala(idSala: number): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/tesorerias/abierta/creada/sala/${idSala}`);
  }

  obtenerResumenCompletoTesoreria(idTesoreria: number): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/tesorerias/resumen/completo/${idTesoreria}`);
  }

  obtenerHistorialMovimientosTesoreria(idTesoreria: number): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/tesorerias/movimientos/historial/${idTesoreria}`);
  }

  abrirTesoreria(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/tesorerias/abrir`, data);
  }

  cerrarTesoreria(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/tesorerias/cerrar`, data);
  }

  reponerTesoreria(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/tesorerias/reponer`, data);
  }

  retirarTesoreria(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/tesorerias/retirar`, data);
  }
}
