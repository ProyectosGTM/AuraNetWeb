import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  constructor(private http: HttpClient) { }

  obtenerClientesData(page: number, pageSize: number): Observable<any> {
		return this.http.get(`${environment.API_SECURITY}/clientes/${page}/${pageSize}`);
	}

  obtenerClientes(): Observable<any> {
		return this.http.get(`${environment.API_SECURITY}/clientes/list`);
	}

  agregarCliente(data: any) {
    const body = data && typeof data === 'object' && !Array.isArray(data) ? { ...data } : data;
    if (body && typeof body === 'object') {
      delete body.estatus;
      if (Number(body.tipoPersona) === 2) {
        // Persona moral: el API espera el texto "NULL", no el literal JSON null
        body.apellidoPaterno = 'null';
        body.apellidoMaterno = 'null';
      }
    }
    return this.http.post(environment.API_SECURITY + '/clientes', body);
  }

  eliminarCliente(idCliente: Number) {
        return this.http.delete(environment.API_SECURITY + '/clientes/' + idCliente);
    }

  obtenerCliente(idCliente: number): Observable<any> {
        return this.http.get<any>(environment.API_SECURITY + '/clientes/' + idCliente);
    }

  actualizarCliente(idCliente: number, saveForm: any): Observable<any> {
    const body =
      saveForm && typeof saveForm === 'object' && !Array.isArray(saveForm)
        ? (({ estatus, ...rest }) => rest)(saveForm)
        : saveForm;
    if (body && typeof body === 'object') {
      if (Number(body.tipoPersona) === 2) {
        body.apellidoPaterno = 'null';
        body.apellidoMaterno = 'null';
      }
    }
    return this.http.patch(`${environment.API_SECURITY}/clientes/` + idCliente, body);
  }

  private apiUrl = `${environment.API_SECURITY}/clientes`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/estatus/${id}`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
}