import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { IdentityService } from './core/services/identity-service';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    title: 'Login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'main',
    canActivate: [authGuard],
    loadComponent: () => import('./main/main').then((m) => m.Main),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => {
          const identity = inject(IdentityService);
          const role = identity.userRole();
          return role === 'Admin' ? 'admin' : 'student';
        },
      },
      {
        path: 'admin',
        data: { role: 'Admin' },
        canActivate: [roleGuard],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoles),
      },
      {
        path: 'student',
        data: { role: 'Student' },
        canActivate: [roleGuard],
        loadChildren: () =>
          import('./features/student/student.routes').then((m) => m.studentRoutes),
      },
    ],
  },

  {
    path: 'access-denied',
    title: 'Access Denied',
    loadComponent: () =>
      import('./shared/components/access-denied/access-denied').then((m) => m.AccessDenied),
  },
  {
    path: '**',
    title: 'Not Found',
    loadComponent: () => import('./shared/components/not-found/not-found').then((m) => m.NotFound),
  },
];

