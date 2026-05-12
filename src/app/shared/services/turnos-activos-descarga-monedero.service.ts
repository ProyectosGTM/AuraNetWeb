import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Solo para el modal «Descargar efectivo» en monederos.
 * No sustituye ni altera `TurnosService.obtenerTurnosActivos()`.
 */
@Injectable({
  providedIn: 'root',
})
export class TurnosActivosDescargaMonederoService {
  constructor(private http: HttpClient) {}

  obtenerTurnosActivosConSala(idSala?: number | string | null): Observable<any> {
    let params = new HttpParams();
    if (idSala != null && idSala !== '') {
      const n = Number(idSala);
      if (Number.isFinite(n) && n > 0) {
        params = params.set('idSala', String(n));
      }
    }
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/activos`, { params });
  }
}
