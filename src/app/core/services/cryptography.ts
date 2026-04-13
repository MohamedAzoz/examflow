import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Cryptography {
  // Simple Base64 encoding/decoding for demonstration
  encode(data: string): string {
    return btoa(data);
  }
  // Simple Base64 encoding/decoding for demonstration
  decode(data: string): string {
    return atob(data);
  }
}
