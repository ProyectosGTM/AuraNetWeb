import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }

  /** POST /dashboard/kpis - Dashboard KPI de casino (Swagger) */
  postKpis(body: any): Observable<any> {
    return this.http.post<any>(`${environment.API_SECURITY}/dashboard/kpis`, body);
  }
}
