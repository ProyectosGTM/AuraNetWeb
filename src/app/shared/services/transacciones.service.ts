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

  // obtenerHistorialMonedero(id: number): Observable<any> {
  //   return this.http.get(`${environment.API_SECURITY}/ledger/movimientos/monedero/${id}`);
  // }

  // obtenerSaldoMonedero(id: number): Observable<any> {
  //   return this.http.get(`${environment.API_SECURITY}/ledger/saldo/monedero/${id}`);
  // }

  obtenerSaldoCaja(id: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/ledger/saldo/caja/${id}`);
  }

  // obtenerSaldoTesoreria(id: number): Observable<any> {
  //   return this.http.get(`${environment.API_SECURITY}/ledger/saldo/tesoreria/${id}`);
  // }
}
