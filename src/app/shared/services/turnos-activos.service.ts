import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TurnosActivosService {

  constructor(private http: HttpClient) { }

  obtenerTurnosActivos(): Observable<any> {
    return this.http.get(`${environment.API_SECURITY}/pos/turnos/activos`);
  }
}
