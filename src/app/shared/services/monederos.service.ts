import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MonederosServices {

  constructor(private http: HttpClient) { }

  obtenerMonederosData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/monederos/${page}/${pageSize}`);
  }

  obtenerMonederos(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/monederos/list`);
  }

  agregarMonedero(data: any) {
    return this.http.post(environment.API_SECURITY + '/monederos', data);
  }

  eliminarMonedero(idMonedero: Number) {
    return this.http.delete(environment.API_SECURITY + '/monederos/' + idMonedero);
  }

  obtenerMonedero(idMonedero: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/monederos/' + idMonedero);
  }

  actualizarMonedero(idMonedero: number, saveForm: any): Observable<any> {
    return this.http.patch(`${environment.API_SECURITY}/monederos/${idMonedero}`, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/monederos`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerAfiliados(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/afiliados/list`);
  }

  obtenerEstatusMonedero(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatusmonedero/list`);
  }

  cargarMonedero(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/monederos/cargar`, data);
  }

  descargarMonedero(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/monederos/descargar`, data);
  }

  consultarSaldoMonedero(numero: string): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/monederos/${numero}`);
  }

  /** POST monederos/cambiar-estatus - Cambiar estatus de un monedero */
  cambiarEstatus(payload: { idMonedero: number; idEstatusMonedero: number; motivo: string }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/monederos/cambiar-estatus`, payload);
  }

  /** POST monederos/traspaso - Traspasar saldo entre monederos del mismo afiliado */
  traspasoMonedero(payload: {
    idTurnoCaja: number;
    idMonederoOrigen: number;
    idMonederoDestino: number;
    monto: number;
  }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/monederos/traspaso`, payload);
  }

  /** GET monederos/afiliado/{idAfiliado} - Obtener monederos de un afiliado */
  obtenerMonederosPorAfiliado(idAfiliado: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/monederos/afiliado/${idAfiliado}`);
  }
}