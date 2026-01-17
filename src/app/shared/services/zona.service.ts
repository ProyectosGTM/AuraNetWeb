import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ZonaService {

  constructor(private http: HttpClient) { }

  obtenerZonasData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/zonas/${page}/${pageSize}`);
  }

  obtenerZonas(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/zonas/list`);
  }

  agregarZona(data: any) {
    return this.http.post(environment.API_SECURITY + '/zonas', data);
  }

  eliminarZona(idSala: Number) {
    return this.http.delete(environment.API_SECURITY + '/zonas/' + idSala);
  }

  obtenerZona(idSala: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/zonas/' + idSala);
  }

  actualizarZona(idSala: number, saveForm: any): Observable<any> {
    return this.http.patch(`${environment.API_SECURITY}/zonas/` + idSala, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/zonas`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerTipoZona(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattiposzona/list`);
  }
}