import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdentityService } from '../services/identity-service';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const identityService = inject(IdentityService);

  if (identityService.isAuthenticated()) {
    return router.navigate([identityService.dashboardPath()]);
  }

  return true;
};

