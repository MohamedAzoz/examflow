import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class JWT {
  public decodeToken(token: string) {
    return jwtDecode(token);
  }
  // public isTokenExpired() {
  //   return this.jwt.isTokenExpired(this.token);
  // }
}
