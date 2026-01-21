import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CajasService {

  constructor(private http: HttpClient) { }

  obtenerCajasData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cajas/${page}/${pageSize}`);
  }

  obtenerCajas(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cajas/list`);
  }

  agregarCaja(data: any) {
    return this.http.post(environment.API_SECURITY + '/cajas', data);
  }

  eliminarCaja(idCaja: Number) {
    return this.http.delete(environment.API_SECURITY + '/cajas/' + idCaja);
  }

  obtenerCajaPorId(idCaja: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/cajas/' + idCaja);
  }

  actualizarCaja(idCaja: number, saveForm: any): Observable<any> {
    return this.http.patch(`${environment.API_SECURITY}/cajas/` + idCaja, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/cajas`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerTiposCaja(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattiposcaja/list`);
  }

  obtenerEstatusCaja(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatuscaja/list`);
  }

  obtenerEstatusAfiliado(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatusafiliado/list`);
  }
}
