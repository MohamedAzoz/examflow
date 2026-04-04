import { environment } from './../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class System {
  private http = inject(HttpClient);

  // /api/System/server-time
  getServerTime() {
    return this.http.get<{ serverTime: string | Date }>(`${environment.apiUrl}/System/server-time`);
  }
}
