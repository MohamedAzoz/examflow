import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  set(key: string, value: string) {
    localStorage.setItem(key, value);
  }
  get(key: string) {
    return localStorage.getItem(key);
  }
  remove(key: string) {
    localStorage.removeItem(key);
  }
  removeAll(prefix: string) {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
  clear() {
    localStorage.clear();
  }
  has(key: string) {
    return localStorage.getItem(key) !== null;
  }
}
