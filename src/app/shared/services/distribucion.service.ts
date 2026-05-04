import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AreaPoligonoJsonPayload {
  dimensiones: { ancho: number; alto: number; zoom: number };
  maquinaTamano: { ancho: number; alto: number };
  zonas: Array<{ id: number; x: number; y: number; w: number; h: number; maquinas: unknown[] }>;
  maquinasSinZona: unknown[];
  entrada?: { x: number; y: number; r: number } | null;
  salida?: { x: number; y: number; r: number } | null;
}

@Injectable({
  providedIn: 'root'
})
export class DistribucionService {

  constructor(private http: HttpClient) { }

  /** GET /layout/mapa/{idSala} */
  obtenerMapaSala(idSala: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/layout/mapa/${idSala}`);
  }

  /** PUT /layout/mapa/{idSala} — cuerpo { areaPoligonoJson: ... } */
  guardarMapaSala(idSala: number, body: { areaPoligonoJson: Record<string, unknown> }): Observable<any> {
    return this.http.put(`${environment.API_SECURITY}/layout/mapa/${idSala}`, body);
  }
}
