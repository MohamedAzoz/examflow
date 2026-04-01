import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdentityService } from '../services/identity-service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const identityService = inject(IdentityService);

  if (!identityService.isAuthenticated()) {
    return router.navigate(['/login']);
  }
  return true;
};
