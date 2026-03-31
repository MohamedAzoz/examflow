import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    title: 'Login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
  },
  {
    path: 'main',
    loadComponent: () => import('./main/main').then((m) => m.Main),
    children: [
      {
        path: 'admin',
        // data: { role: 'Admin' },
        // canActivate: [roleGuard],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoles),
      },
      {
        path: 'student',
        loadComponent: () =>
          import('./features/student/pages/dashboard/dashboard').then((m) => m.DashboardComponent),
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
