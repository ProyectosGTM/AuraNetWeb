import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AfiliadosService {

  constructor(private http: HttpClient) { }

  obtenerAfiliadosData(page: number, limit: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/afiliados/${page}/${limit}`);
  }

  obtenerAfiliados(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/afiliados/list`);
  }

  agregarAfiliado(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/afiliados`, data);
  }

  eliminarAfiliado(id: number): Observable<any> {
    return this.http.delete(`${environment.API_SECURITY}/afiliados/${id}`);
  }

  obtenerAfiliadoPorId(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/afiliados/${id}`);
  }

  actualizarAfiliado(id: number, data: any): Observable<any> {
    return this.http.patch(`${environment.API_SECURITY}/afiliados/${id}`, data);
  }

  obtenerTipoIdentificacion(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattiposidentificacion/list`);
  }

  private apiUrl = `${environment.API_SECURITY}/afiliados`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}
