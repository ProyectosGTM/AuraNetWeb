import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AfiliadosService {

  private readonly baseUrl = `${environment.API_SECURITY}/afiliados`;

  constructor(private http: HttpClient) { }

  /**
   * Normaliza el id para rutas `/afiliados/{id}/...` (evita NaN o valores inválidos en la URL).
   */
  private idAfiliadoValido(id: number): number | null {
    const n = Math.trunc(Number(id));
    if (!Number.isFinite(n) || n < 1) {
      return null;
    }
    return n;
  }

  // ——— GET (Swagger Afiliados) ———

  /** GET /afiliados/list */
  obtenerAfiliados(): Observable<any> {
    return this.http.get(`${this.baseUrl}/list`);
  }

  /** GET /afiliados/{page}/{limit} */
  obtenerAfiliadosData(page: number, limit: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${page}/${limit}`);
  }

  /** GET /afiliados/{id} */
  obtenerAfiliadoPorId(id: number): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.get(`${this.baseUrl}/${idAfiliado}`);
  }

  /**
   * GET /afiliados/buscar
   * Filtros como query string (nombres según tu Swagger: texto, idSala, fechas, etc.).
   */
  buscarAfiliados(filtros?: Record<string, string | number | boolean | null | undefined>): Observable<any> {
    let params = new HttpParams();
    if (filtros) {
      for (const key of Object.keys(filtros)) {
        const v = filtros[key];
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          params = params.set(key, String(v));
        }
      }
    }
    return this.http.get(`${this.baseUrl}/buscar`, { params });
  }

  /** GET /afiliados/numero/{numeroIdentificacion} */
  obtenerAfiliadoPorNumeroIdentificacion(numeroIdentificacion: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/numero/${encodeURIComponent(numeroIdentificacion)}`
    );
  }

  /**
   * GET /afiliados/{id}/resumen
   * Dashboard/resumen del afiliado: saldos, actividad y estadísticas (contrato Swagger).
   * La API exige roles: Cajero (5), Jefe de Sala (3), Supervisor (4) o Gerente (2).
   */
  obtenerResumenAfiliado(id: number): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.get(`${this.baseUrl}/${idAfiliado}/resumen`);
  }

  /** GET /afiliados/{id}/monederos */
  obtenerMonederosAfiliado(id: number): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.get(`${this.baseUrl}/${idAfiliado}/monederos`);
  }

  /** GET /afiliados/cumpleaneros */
  obtenerCumpleaneros(): Observable<any> {
    return this.http.get(`${this.baseUrl}/cumpleaneros`);
  }

  /** GET /afiliados/inactivos */
  obtenerAfiliadosInactivos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/inactivos`);
  }

  /** GET /cattiposidentificacion/list (catálogo para formularios) */
  obtenerTipoIdentificacion(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattiposidentificacion/list`);
  }

  /** GET /catnivelesvip/list (catálogo niveles VIP) */
  obtenerNivelesVip(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catnivelesvip/list`);
  }

  // ——— Escritura (no GET) ———

  agregarAfiliado(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, data);
  }

  /**
   * DELETE /afiliados/{id}
   * Soft delete: marca al afiliado como inactivo (no borra el registro).
   * Respuesta 200 típica: { status, message, data } (application/json).
   */
  eliminarAfiliado(id: number): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.delete(`${this.baseUrl}/${idAfiliado}`);
  }

  actualizarAfiliado(id: number, data: any): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.patch(`${this.baseUrl}/${idAfiliado}`, data);
  }

  updateEstatus(id: number, estatus: number): Observable<string> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    const url = `${this.baseUrl}/estatus/${idAfiliado}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * POST /afiliados/{id}/bloquear
   * Bloquea al afiliado y sus monederos. Body: motivo, fechaFinBloqueo (YYYY-MM-DD).
   */
  bloquearAfiliado(id: number, body: { motivo: string; fechaFinBloqueo: string }): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.post(`${this.baseUrl}/${idAfiliado}/bloquear`, body);
  }

  /**
   * POST /afiliados/{id}/desbloquear
   * Desbloquea al afiliado y reactiva sus monederos.
   */
  desbloquearAfiliado(id: number): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.post(`${this.baseUrl}/${idAfiliado}/desbloquear`, {});
  }

  /**
   * POST /afiliados/{id}/autoexclusion
   * Programa de juego responsable. Body: motivo, duracionDias (mín. 30), observaciones.
   */
  registrarAutoexclusion(
    id: number,
    body: { motivo: string; duracionDias: number; observaciones: string }
  ): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.post(`${this.baseUrl}/${idAfiliado}/autoexclusion`, body);
  }

  /**
   * DELETE /afiliados/{id}/autoexclusion
   * Cancela la autoexclusión solo después de cumplida la fecha de fin (validación en API).
   */
  cancelarAutoexclusion(id: number): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.delete(`${this.baseUrl}/${idAfiliado}/autoexclusion`);
  }

  /**
   * POST /afiliados/{id}/nivel-vip
   * Actualización manual del nivel VIP. Body: idNivelVIP, motivo.
   */
  actualizarNivelVip(id: number, body: { idNivelVIP: number; motivo: string }): Observable<any> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    return this.http.post(`${this.baseUrl}/${idAfiliado}/nivel-vip`, body);
  }
}
