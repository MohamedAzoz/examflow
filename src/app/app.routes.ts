import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { IdentityService } from './core/services/identity-service';
import { ROUTES } from './core/constants/const.route';
import { ROLES } from './core/constants/ROLES';

export const routes: Routes = [
  {
    path: '',
    redirectTo: ROUTES.LOGIN.path,
    pathMatch: 'full',
  },
  {
    path: ROUTES.LOGIN.path,
    title: ROUTES.LOGIN.title,
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: ROUTES.MAIN.path,
    title: ROUTES.MAIN.title,
    canActivate: [authGuard],
    loadComponent: () => import('./main/main').then((m) => m.Main),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => {
          const identity = inject(IdentityService);
          const role = identity.userRole();
          return role === ROLES.Admin ? ROUTES.ADMIN.path : ROUTES.STUDENT.path;
        },
      },
      {
        path: ROUTES.ADMIN.path,
        data: { role: ROLES.Admin },
        canActivate: [roleGuard],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoles),
      },
      {
        path: ROUTES.STUDENT.path,
        data: { role: ROLES.Student },
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./features/student/student.routes').then((m) => m.studentRoutes),
      },
    ],
  },

  {
    path: ROUTES.ACCESS_DENIED.path,
    title: ROUTES.ACCESS_DENIED.title,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/access-denied/access-denied').then((m) => m.AccessDenied),
  },
  {
    path: ROUTES.NOT_FOUND.path,
    title: ROUTES.NOT_FOUND.title,
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/not-found/not-found').then((m) => m.NotFound),
  },
];
