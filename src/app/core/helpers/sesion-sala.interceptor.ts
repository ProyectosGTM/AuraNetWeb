import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/auth.service';

/**
 * Usuarios de sala (Gerente, Jefe de Sala, Cajero, Técnico): el servidor toma `idCliente` e `idSala`
 * de la sesión (ESPECIFICACION_FRONT §9). Este interceptor deja de mandarlos cuando son los mismos
 * de la sesión. Si un formulario manda otros, se respetan y la API responde 403.
 */
@Injectable()
export class SesionSalaInterceptor implements HttpInterceptor {
  private static readonly ROLES_SALA = new Set(['5', '6', '7', '8']);

  constructor(private auth: AuthenticationService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!['POST', 'PATCH', 'PUT'].includes(req.method)) return next.handle(req);
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || body instanceof FormData) return next.handle(req);

    let user: any = null;
    try { user = this.auth.getUser(); } catch { user = null; }
    if (!user || !SesionSalaInterceptor.ROLES_SALA.has(String(user.rol ?? ''))) return next.handle(req);

    const igual = (a: any, b: any) => a != null && b != null && String(a) === String(b);
    const quitarSala = 'idSala' in body && igual(body.idSala, user.idSala);
    const quitarCliente = 'idCliente' in body && igual(body.idCliente, user.idCliente);
    if (!quitarSala && !quitarCliente) return next.handle(req);

    const limpio = { ...body };
    if (quitarSala) delete limpio.idSala;
    if (quitarCliente) delete limpio.idCliente;
    return next.handle(req.clone({ body: limpio }));
  }
}
