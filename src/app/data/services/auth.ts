import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Ilogin } from '../models/auth/ilogin';
import { Iregister } from '../models/auth/iregister';
import { IResponseAuth } from '../models/auth/iresponse-auth';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  public login(body: Ilogin): Observable<IResponseAuth> {
    return this.http.post<IResponseAuth>(`${environment.apiUrl}/Authentication/login`, body,{
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  public register(body: Iregister): Observable<IResponseAuth> {
    return this.http.post<IResponseAuth>(`${environment.apiUrl}/Authentication/register`, body,{
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
