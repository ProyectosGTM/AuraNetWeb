import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthenticationService } from '../services/auth.service';
import { ApiError, MENSAJES_CODIGO_ERROR, textoDeError } from 'src/app/shared/utils/api-error';

/**
 * Manejo de errores de la API (ESPECIFICACION_FRONT §2, §7, §13).
 * - El mensaje llega como texto plano.
 * - Un 401 de las rutas de login (contraseña o código incorrecto) NO cierra la sesión.
 * - 403 `SEGUNDO_FACTOR_PENDIENTE` lleva a la pantalla de alta del segundo factor.
 * - 404 se muestra como "No encontrado" (también cuando es de otra sala u otro cliente).
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService, private router: Router) { }

  private static readonly RUTAS_LOGIN = /\/login(\/|$)|\/segundo-factor\/(activar|desactivar|codigos-respaldo)|\/monederos\/ajuste$/;

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError((err: HttpErrorResponse) => {
      const codigo = err.headers?.get('X-Codigo-Error') || null;
      const esRutaLogin = ErrorInterceptor.RUTAS_LOGIN.test(request.url.split('?')[0]);

      if (err.status === 401 && !esRutaLogin) {
        this.authenticationService.logout();
        location.reload();
      }

      if (err.status === 403 && codigo === 'SEGUNDO_FACTOR_PENDIENTE') {
        this.router.navigate(['/account/segundo-factor']);
      }

      let mensaje = textoDeError(err.error);
      if (codigo && MENSAJES_CODIGO_ERROR[codigo]) mensaje = MENSAJES_CODIGO_ERROR[codigo];
      if (err.status === 404) mensaje = 'No encontrado.';
      if (err.status === 0) mensaje = 'No hay conexión con el servidor. Intenta de nuevo.';
      if (!mensaje) mensaje = err.message || err.statusText || 'Error desconocido';

      const apiError: ApiError = {
        status: err.status,
        message: mensaje,
        error: mensaje,
        codigo,
        raw: err.error,
      };
      return throwError(() => apiError);
    }));
  }
}
