import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/** JSON guardado en sala para el diagrama de distribución (layout/mapa). */
export interface AreaPoligonoJsonPayload {
  dimensiones: { ancho: number; alto: number; zoom: number };
  maquinaTamano: { ancho: number; alto: number };
  zonas: Array<{ id: number; x: number; y: number; w: number; h: number; maquinas: unknown[] }>;
  maquinasSinZona: unknown[];
  entrada?: { x: number; y: number; r: number } | null;
  salida?: { x: number; y: number; r: number } | null;
}

/** Respuesta típica del GET /layout/mapa/{idSala}. */
export interface LayoutMapaSalaResponse {
  areaPoligonoJson?: AreaPoligonoJsonPayload;
  maquinasSinZona?: unknown[];
}

@Injectable({
  providedIn: 'root'
})
export class SalaService {

  constructor(private http: HttpClient) { }

  /** GET /layout/mapa/{idSala} — diagrama de distribución de la sala. */
  obtenerLayoutMapaSala(idSala: number): Observable<LayoutMapaSalaResponse | { data?: LayoutMapaSalaResponse }> {
    return this.http.get<LayoutMapaSalaResponse | { data?: LayoutMapaSalaResponse }>(
      `${environment.API_SECURITY}/layout/mapa/${idSala}`
    );
  }

  /** PATCH /layout/mapa/{idSala} */
  guardarLayoutMapaSala(idSala: number, body: { areaPoligonoJson: Record<string, unknown> }): Observable<unknown> {
    return this.http.patch<unknown>(`${environment.API_SECURITY}/layout/mapa/${idSala}`, body);
  }

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
    return this.http.patch(`${environment.API_SECURITY}/salas/` + idSala, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/salas`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerMonedas(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catmonedas/list`);
  }

  obtenerEstatusLic(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatuslicencia/list`);
  }
}