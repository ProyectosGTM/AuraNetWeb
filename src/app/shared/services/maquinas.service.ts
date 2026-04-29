import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MaquinasService {

  constructor(private http: HttpClient) { }

  obtenerMaquinasData(page: number, pageSize: number): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/maquinas/${page}/${pageSize}`);
  }

  obtenerMaquinas(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/maquinas/list`);
  }

  agregarMaquina(data: any) {
    return this.http.post(environment.API_SECURITY + '/maquinas', data);
  }

  eliminarMaquina(idMaquina: Number) {
    return this.http.delete(environment.API_SECURITY + '/maquinas/' + idMaquina);
  }

  obtenerMaquina(idMaquina: number): Observable<any> {
    return this.http.get<any>(environment.API_SECURITY + '/maquinas/' + idMaquina);
  }

  actualizarMaquina(idMaquina: number, saveForm: any): Observable<any> {
    return this.http.patch(`${environment.API_SECURITY}/maquinas/` + idMaquina, saveForm);
  }

  private apiUrl = `${environment.API_SECURITY}/maquinas`;
  updateEstatus(id: number, estatus: number): Observable<string> {
    const url = `${this.apiUrl}/${id}/estatus`;
    const body = { estatus };
    return this.http.patch(url, body, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  obtenerTiposMaquina(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/cattiposmaquina/list`);
  }

  obtenerFabricantes(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catfabricantes/list`);
  }

  obtenerEstatusMaquina(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/catestatusmaquina/list`);
  }
}
