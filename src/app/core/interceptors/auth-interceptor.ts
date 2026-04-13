import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { IdentityService } from '../services/identity-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const identityService = inject(IdentityService);
  const token = identityService.token();

  if (!token) {
    return next(req);
  }

  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(clonedReq);
};
