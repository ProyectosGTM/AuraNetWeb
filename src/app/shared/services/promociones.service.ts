import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PromocionesService {
  private base = `${environment.API_SECURITY}/promociones`;

  constructor(private http: HttpClient) {}

  /** GET /promociones - Listar promociones */
  listar(params?: { [key: string]: string | number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        const v = params[k];
        if (v !== undefined && v !== null && v !== '') {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http.get(this.base, { params: httpParams });
  }

  /** GET /promociones/{id} - Obtener por ID */
  obtenerPorId(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  /** GET /promociones/vigentes */
  vigentes(): Observable<any> {
    return this.http.get(`${this.base}/vigentes`);
  }

  /** GET /promociones/por-vencer */
  porVencer(): Observable<any> {
    return this.http.get(`${this.base}/por-vencer`);
  }

  /** GET /promociones/afiliado/{id} */
  porAfiliado(idAfiliado: number): Observable<any> {
    return this.http.get(`${this.base}/afiliado/${idAfiliado}`);
  }

  /** GET /promociones/monedero/{id} */
  porMonedero(idMonedero: number): Observable<any> {
    return this.http.get(`${this.base}/monedero/${idMonedero}`);
  }

  /** GET /promociones/{id}/rollover */
  rollover(idPromocion: number): Observable<any> {
    return this.http.get(`${this.base}/${idPromocion}/rollover`);
  }

  /** GET /promociones/{id}/rollover/historial */
  rolloverHistorial(idPromocion: number): Observable<any> {
    return this.http.get(`${this.base}/${idPromocion}/rollover/historial`);
  }

  /** GET /promociones/pendientes-conversion */
  pendientesConversion(): Observable<any> {
    return this.http.get(`${this.base}/pendientes-conversion`);
  }

  /** GET /promociones/reporte */
  reporte(params?: { [key: string]: string | number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        const v = params[k];
        if (v !== undefined && v !== null && v !== '') {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http.get(`${this.base}/reporte`, { params: httpParams });
  }

  /** GET /promociones/cron/expirar (utilidad) */
  cronExpirar(): Observable<any> {
    return this.http.get(`${this.base}/cron/expirar`);
  }

  /** Catálogos para filtros/formularios */
  estatusPromocion(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatuspromocion/list`);
  }

  tiposPromocion(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattipospromocion/list`);
  }
}
