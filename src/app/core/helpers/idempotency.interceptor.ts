import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

/**
 * Agrega `Idempotency-Key` a las operaciones que mueven dinero, saldo o puntos (ESPECIFICACION_FRONT §1).
 *
 * La llave se reutiliza mientras la MISMA operación (ruta + cuerpo) no haya terminado bien:
 *  - Doble clic o reintento tras una falla de red → misma llave → la API no duplica la operación.
 *  - Respuesta exitosa → la llave se descarta: la siguiente operación igual es otra operación.
 *  - Error 4xx distinto de 409 → la llave se descarta (la API no la guardó).
 * Si el componente ya manda su propia llave, se respeta.
 */
@Injectable()
export class IdempotencyInterceptor implements HttpInterceptor {
  static readonly RUTAS: RegExp[] = [
    /\/pos\/monederos\/(cargar|descargar|promocion|puntos)$/,
    /\/pos\/turnos\/(abrir|cerrar|reponer|retirar|cerrar-forzado)$/,
    /\/monederos\/(traspaso|ajuste|reemplazar)$/,
    /\/tesorerias\/(abrir|cerrar|reponer|retirar|retirar-ganancia)$/,
    /\/promociones\/(otorgar|otorgar-masivo)$/,
    /\/promociones\/(cancelar|convertir)\/[^/]+$/,
    /\/lealtad\/puntos\/canjear$/,
    /\/sesiones-juego\/[^/]+\/cierre-manual$/,
  ];

  /** Llaves vivas por operación (ruta + cuerpo). */
  private readonly llaves = new Map<string, string>();

  static requiereLlave(url: string): boolean {
    const ruta = url.split('?')[0];
    return IdempotencyInterceptor.RUTAS.some((r) => r.test(ruta));
  }

  static nuevaLlave(): string {
    const c: any = (globalThis as any).crypto;
    if (c?.randomUUID) return c.randomUUID();
    return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method !== 'POST' || !IdempotencyInterceptor.requiereLlave(req.url) || req.headers.has('Idempotency-Key')) {
      return next.handle(req);
    }

    const firma = req.url.split('?')[0] + '|' + this.serializar(req.body);
    let llave = this.llaves.get(firma);
    if (!llave) {
      llave = IdempotencyInterceptor.nuevaLlave();
      this.llaves.set(firma, llave);
    }

    return next.handle(req.clone({ setHeaders: { 'Idempotency-Key': llave } })).pipe(
      tap({
        next: (ev) => { if (ev instanceof HttpResponse) this.llaves.delete(firma); },
        error: (err: HttpErrorResponse) => {
          if (err?.status >= 400 && err.status < 500 && err.status !== 409) this.llaves.delete(firma);
        },
      })
    );
  }

  private serializar(body: any): string {
    if (body == null) return '';
    if (body instanceof FormData) return '';
    try {
      return JSON.stringify(body, Object.keys(body).sort());
    } catch {
      return String(body);
    }
  }
}
