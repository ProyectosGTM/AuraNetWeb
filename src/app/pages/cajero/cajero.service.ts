import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TicketCaja } from './models/ticket-caja.model';

/**
 * Carga de tickets para cajero.
 * Sustituir `cargarTickets()` por HttpClient cuando el backend exponga el endpoint.
 */
@Injectable({ providedIn: 'root' })
export class CajeroService {
  cargarTickets(): Observable<TicketCaja[]> {
    const datos: TicketCaja[] = [
      { id: 1, cxp: 'CXP-1001', ubicacion: 'Salón principal', mesa: 'M-12', mesero: 'Ana' },
      { id: 2, cxp: 'CXP-1002', ubicacion: 'Terraza', mesa: 'T-04', mesero: 'Luis' },
      { id: 3, cxp: 'CXP-1003', ubicacion: 'VIP', mesa: 'V-01', mesero: 'María' },
      { id: 4, cxp: 'CXP-1004', ubicacion: 'Salón principal', mesa: 'M-08', mesero: 'Ana' },
      { id: 5, cxp: 'CXP-1005', ubicacion: 'Barra', mesa: 'B-02', mesero: 'Carlos' },
      { id: 6, cxp: 'CXP-1006', ubicacion: 'Terraza', mesa: 'T-09', mesero: 'Luis' },
      { id: 7, cxp: 'CXP-1007', ubicacion: 'Salón principal', mesa: 'M-03', mesero: 'María' },
    ];
    return of(datos).pipe(delay(120));
  }
}
