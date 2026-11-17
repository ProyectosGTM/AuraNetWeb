import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {

  constructor(private http: HttpClient) { }

  obtenerBitacoraData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/bitacora/${page}/${pageSize}`);
  }

  /** `GET /bitacora/list` se retira (§11): se usa el paginado desde la página 1. */
  obtenerBitacora(): Observable<any> {
    return this.obtenerBitacoraData(1, 10000);
  }

  obtenerBitacoraPorId(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/bitacora/${id}`);
  }
  
}
