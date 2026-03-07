import { inject, Injectable } from '@angular/core';
import { LocalStorage } from './local-storage';

@Injectable({
  providedIn: 'root',
})
export class RoleCheck {
  private localstorige = inject(LocalStorage);

  hasRole(role: string) {
    const value = this.localstorige.get('role') ?? null;
    return role === value;
  }
}
