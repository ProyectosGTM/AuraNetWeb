import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { SalaService } from './salas.service';
import { RolAccesoService } from './rol-acceso.service';

/**
 * ¿La sala de la sesión exige el PIN del monedero? (ESPECIFICACION_FRONT §13.4)
 * Si no se puede saber (usuario sin sala o error), se asume que SÍ lo exige.
 */
@Injectable({ providedIn: 'root' })
export class PinSalaService {
  private cache$?: Observable<boolean>;
  private idSalaCache: number | null = null;

  constructor(private salas: SalaService, private rolAcceso: RolAccesoService) { }

  exigePin(): Observable<boolean> {
    const idSala = this.rolAcceso.obtenerIdSalaSesion();
    if (!idSala) return of(true);
    if (!this.cache$ || this.idSalaCache !== idSala) {
      this.idSalaCache = idSala;
      this.cache$ = this.salas.obtenerSala(idSala).pipe(
        map((r: any) => {
          const sala = r?.data ?? r;
          const v = sala?.exigePin;
          return v === undefined || v === null ? true : Number(v) === 1 || v === true;
        }),
        catchError(() => of(true)),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  /** Olvidar el valor guardado (después de cambiar el interruptor de la sala). */
  limpiar(): void {
    this.cache$ = undefined;
  }

  /** PIN válido: 4 a 6 dígitos. */
  static esPinValido(pin: string | null | undefined): boolean {
    return /^\d{4,6}$/.test(String(pin ?? ''));
  }
}
