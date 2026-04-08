import { environment } from './../../../environments/environment.development';
import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SkipLoading } from '../../core/interceptors/loading-interceptor';

@Injectable({
  providedIn: 'root',
})
export class System {
  private http = inject(HttpClient);

  // /api/System/server-time
  getServerTime() {
    return this.http.get<{ serverTime: string }>(`${environment.apiUrl}/System/server-time`, {
      context: new HttpContext().set(SkipLoading, true),
    });
  }
}
