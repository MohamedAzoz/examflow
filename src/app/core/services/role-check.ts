import { inject, Injectable } from '@angular/core';
import { IdentityService } from './identity-service';

@Injectable({
  providedIn: 'root',
})
export class RoleCheck {
  private readonly identityService = inject(IdentityService);

  hasRole(role: string): boolean {
    // Uses the reactive signal from IdentityService
    const currentRole = this.identityService.userRole();
    return role === currentRole;
  }
}

