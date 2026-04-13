import { inject, Injectable } from '@angular/core';
import { IdentityService } from './identity-service';
import { JWT } from './jwt';
import { IJWT } from '../../data/models/auth/ijwt';

@Injectable({
  providedIn: 'root',
})
export class RoleCheck {
  private readonly identityService = inject(IdentityService);
  private readonly jwt = inject(JWT);

  hasRole(role: string): boolean {
    const currentRole = this.identityService.userRole();
    if (!currentRole) {
      return false;
    }
    return role === currentRole;
  }
}
