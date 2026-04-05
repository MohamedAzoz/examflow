import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Ilogin } from '../models/auth/ilogin';
import { Iregister } from '../models/auth/iregister';
import { IResponseAuth } from '../models/auth/iresponse-auth';
import { IVoTp } from '../models/auth/IVoTp';
import { IReqVoTp } from '../models/auth/IReqVoTp';
import { IresetPassword } from '../models/auth/IresetPassword';
import { IconfirmEmail } from '../models/auth/IconfirmEmail';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  public login(body: Ilogin): Observable<IResponseAuth> {
    return this.http.post<IResponseAuth>(`${environment.apiUrl}/Authentication/login`, body);
  }
 
  //   POST
  // /api/Authentication/request-email
  public requestEmail(newEmail: string) {
    return this.http.post(`${environment.apiUrl}/Authentication/request-email`, {
      newEmail,
    });
  }

  // POST
  // /api/Authentication/confirm-email
  public confirmEmail(data: IconfirmEmail) {
    return this.http.post(`${environment.apiUrl}/Authentication/confirm-email`, data);
  }

  // POST
  // /api/Authentication/forget-password
  public forgetPassword(email: string) {
    return this.http.post(`${environment.apiUrl}/Authentication/forget-password`, { email });
  }

  // POST
  // /api/Authentication/verify-otp
  public verifyOtp(data: IReqVoTp): Observable<IVoTp> {
    return this.http.post<IVoTp>(`${environment.apiUrl}/Authentication/verify-otp`, data);
  }
  //POST
  //api/Authentication/reset-password
  public resetPassword(data: IresetPassword) {
    return this.http.post(`${environment.apiUrl}/Authentication/reset-password`, data);
  }
}
