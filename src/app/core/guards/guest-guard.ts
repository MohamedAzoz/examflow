import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdentityService } from '../services/identity-service';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const identityService = inject(IdentityService);

  return identityService.isAuthenticated()
    ? router.createUrlTree([identityService.dashboardPath()])
    : true;
};
