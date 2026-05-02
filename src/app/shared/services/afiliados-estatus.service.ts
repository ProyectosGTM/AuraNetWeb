import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Solo cambio de estatus activo/inactivo del afiliado vía PATCH.
 * No incluye bloqueo, autoexclusión, VIP ni PATCH del registro completo (`AfiliadosService`).
 */
@Injectable({
  providedIn: 'root',
})
export class AfiliadosEstatusService {
  private readonly apiUrl = `${environment.API_SECURITY}/afiliados`;

  constructor(private http: HttpClient) {}

  private idAfiliadoValido(id: number): number | null {
    const n = Math.trunc(Number(id));
    if (!Number.isFinite(n) || n < 1) {
      return null;
    }
    return n;
  }

  /**
   * PATCH /afiliados/estatus/{id}
   * Body: `{ estatus }` (p. ej. 1 activo, 0 inactivo), mismo patrón que grids de zonas, máquinas, salas, etc.
   */
  updateEstatus(id: number, estatus: number): Observable<string> {
    const idAfiliado = this.idAfiliadoValido(id);
    if (idAfiliado === null) {
      return throwError(() => ({ error: 'ID de afiliado inválido' }));
    }
    const url = `${this.apiUrl}/estatus/${idAfiliado}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
