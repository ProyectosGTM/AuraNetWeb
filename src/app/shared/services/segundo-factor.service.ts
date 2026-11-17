import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EstadoSegundoFactor {
  activo: boolean;
  obligatorio: boolean;
  debeConfigurar: boolean;
  codigosRespaldoRestantes: number;
  desde: string | null;
}

/** Segundo factor con app autenticadora (ESPECIFICACION_FRONT §13.2). */
@Injectable({ providedIn: 'root' })
export class SegundoFactorService {
  private readonly api = `${environment.API_SECURITY}/segundo-factor`;

  constructor(private http: HttpClient) { }

  estado(): Observable<EstadoSegundoFactor> {
    return this.http.get<EstadoSegundoFactor>(this.api);
  }

  /** → { secreto, uri, emisor } */
  alta(): Observable<{ secreto: string; uri: string; emisor: string }> {
    return this.http.post<any>(`${this.api}/alta`, {});
  }

  /** → { codigosRespaldo: string[] } */
  activar(codigo: string): Observable<{ codigosRespaldo: string[] }> {
    return this.http.post<any>(`${this.api}/activar`, { codigo });
  }

  /** → 10 códigos nuevos; los anteriores dejan de servir. */
  regenerarCodigos(codigo: string): Observable<any> {
    return this.http.post<any>(`${this.api}/codigos-respaldo`, { codigo });
  }

  /** Solo roles donde es opcional. */
  desactivar(password: string, codigo: string): Observable<any> {
    return this.http.post<any>(`${this.api}/desactivar`, { password, codigo });
  }
}
