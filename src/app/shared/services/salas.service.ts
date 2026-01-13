import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalaService {

  constructor(private http: HttpClient) { }

  obtenerSalasData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/salas/${page}/${pageSize}`);
  }

  obtenerSalas(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/salas/list`);
  }

  agregarSala(data: any) {
    return this.http.post(environment.API_SECURITY + '/salas', data);
  }

  eliminarSala(idSala: Number) {
    return this.http.delete(environment.API_SECURITY + '/salas/' + idSala);
  }

  obtenerSala(idSala: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/salas/' + idSala);
  }

  actualizarSala(idSala: number, saveForm: any): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/salas/` + idSala, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/salas`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
}