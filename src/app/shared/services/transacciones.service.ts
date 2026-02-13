import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransaccionesService {

  constructor(private http: HttpClient) { }

  obtenerMovimientosPaginados(page: number, limit: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/ledger/${page}/${limit}`);
  }

  /** GET ledger/saldo/monedero/{id} - Obtener saldos de un monedero */
  obtenerSaldoMonedero(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/ledger/saldo/monedero/${id}`);
  }

  /** GET ledger/saldo/caja/{id} - Obtener saldo de una caja */
  obtenerSaldoCaja(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/ledger/saldo/caja/${id}`);
  }

  /** GET ledger/movimientos/monedero/{id} - Historial de movimientos de monedero */
  obtenerHistorialMonedero(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/ledger/movimientos/monedero/${id}`);
  }
}
