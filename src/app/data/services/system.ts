import { environment } from './../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root', 
})
export class System {
  private http = inject(HttpClient);

  // /api/System/server-time
  getServerTime() {
    return this.http.get<{ serverTime: string }>(`${environment.apiUrl}/System/server-time`);
  }
}
