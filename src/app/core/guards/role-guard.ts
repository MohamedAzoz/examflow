import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleCheck } from '../services/role-check';
import { IdentityService } from '../services/identity-service';

export const roleGuard: CanActivateFn = (route, state) => {
  const rol = inject(RoleCheck);
  const identity = inject(IdentityService);
  const router = inject(Router);
  const requiredPermission = route.data['role'];

  if (!identity.isAuthenticated()) {
    return router.navigate(['/login']);
  }
  // 1. إذا كان الرابط لا يتطلب صلاحية أصلاً، اسمح بالمرور
  if (!requiredPermission) {
    return true;
  }

  // 2. فحص هل المستخدم يملك هذه الصلاحية
  const hasRole = rol.hasRole(requiredPermission);

  if (hasRole) {
    return true; // مسموح له بالدخول
  } else {
    return router.createUrlTree(['/access-denied']);
  }
};
