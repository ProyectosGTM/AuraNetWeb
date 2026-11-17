import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MonederosServices {

  constructor(private http: HttpClient) { }

  obtenerMonederosData(page: number, pageSize: number, todos: boolean = false): Observable<any> {
    const url = `${environment.API_SECURITY}/monederos/${page}/${pageSize}`;
    if (todos) {
      const params = new HttpParams().set('todos', 'true');
      return this.http.get(url, { params });
    }
    return this.http.get(url);
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
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerAfiliados(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/afiliados/list`);
  }

  obtenerAfiliadosSinMonedero(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/afiliados/list/sin-monedero`);
  }

  obtenerEstatusMonedero(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatusmonedero/list`);
  }

  /** GET /cattipossaldo/list — catálogo de tipos de saldo (ajuste de monedero, etc.). */
  obtenerCatTiposSaldo(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattipossaldo/list`);
  }

  cargarMonedero(data: any): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/monederos/cargar`, data);
  }

  /** POST pos/monederos/descargar — { idMonedero, monto, pin, idCaja? } (§3). */
  descargarMonedero(data: { idMonedero: number; monto: number; pin?: string; idCaja?: number }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/monederos/descargar`, data);
  }

  consultarSaldoMonedero(numero: string): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/monederos/${numero}`);
  }

  /** POST monederos/cambiar-estatus — estatus permitidos 1 Activo, 3 Extraviado, 4 Robado, 6 Cancelado (§5). */
  cambiarEstatus(payload: { idMonedero: number; idEstatusMonedero: number; motivo?: string }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/monederos/cambiar-estatus`, payload);
  }

  /** POST monederos/traspaso — `pin` es el del monedero ORIGEN; el turno sale de la sesión (§3). */
  traspasoMonedero(payload: {
    idTurnoCaja?: number;
    idMonederoOrigen: number;
    idMonederoDestino: number;
    monto: number;
    pin?: string;
  }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/monederos/traspaso`, payload);
  }

  /** GET /monederos/afiliado/{idAfiliado} — monederos del afiliado (p. ej. traspaso origen/destino). */
  obtenerMonederosPorAfiliado(idAfiliado: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/monederos/afiliado/${idAfiliado}`);
  }

  /** GET monederos/motivos-ajuste — catálogo [{ codigo, nombre }] (§4). */
  obtenerMotivosAjuste(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/monederos/motivos-ajuste`);
  }

  /** POST monederos/ajuste — solo Gerente; `autorizacion` solo arriba del tope (§4, §13.3). */
  ajusteMonedero(payload: {
    idMonedero: number;
    tipoAjuste: 'positivo' | 'negativo';
    idTipoSaldo: number;
    monto: number;
    motivo: string;
    justificacion: string;
    autorizacion?: { userName: string; password: string; codigo?: string };
  }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/monederos/ajuste`, payload);
  }

  /** GET monederos/numero/{numero} - Consultar monedero por número RFID (Swagger) */
  obtenerMonederoPorNumero(numero: string): Observable<any> {
    return this.http.get<any>(`${environment.API_SECURITY}/monederos/numero/${encodeURIComponent(numero)}`);
  }

  /** GET monederos/movimientos/historial/{id} - Historial de movimientos de un monedero */
  obtenerHistorialMovimientosMonedero(idMonedero: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/monederos/movimientos/historial/${idMonedero}`);
  }

  /** POST monederos/reemplazar — `pinActual` obligatorio; `pin` es el PIN nuevo (opcional) (§3). */
  reemplazarMonedero(payload: {
    idMonederoAnterior: number;
    numeroMonederoNuevo: string;
    pinActual?: string;
    codigoRFID?: string;
    pin?: string;
    alias?: string;
    motivo?: string;
    transferirSaldo?: true;
  }): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/monederos/reemplazar`, payload);
  }

  /* ===== Monedero digital (§13.7) ===== */

  /** POST monederos/:id/digital/vinculacion — { pin } → { codigo, urlVinculacion?, expira }. */
  generarVinculacionDigital(idMonedero: number, pin: string): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/monederos/${idMonedero}/digital/vinculacion`, { pin });
  }

  /** GET monederos/:id/digital/dispositivos — teléfonos vinculados. */
  obtenerDispositivosDigitales(idMonedero: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/monederos/${idMonedero}/digital/dispositivos`);
  }

  /** POST monederos/digital/dispositivos/:id/revocar — { motivo } (Gerente). */
  revocarDispositivoDigital(idDispositivo: number, motivo: string): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/monederos/digital/dispositivos/${idDispositivo}/revocar`, { motivo });
  }

  /** POST pos/monedero-digital/resolver — { codigoQr } → { idMonedero }. */
  resolverQrDigital(codigoQr: string): Observable<any> {
    return this.http.post(`${environment.API_SECURITY}/pos/monedero-digital/resolver`, { codigoQr });
  }
}
