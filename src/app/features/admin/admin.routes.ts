import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role-guard';

export const adminRoles: Routes = [
  { path: '', redirectTo: 'user-managment', pathMatch: 'full' },
  {
    path: 'user-managment',
    title: 'User Managment',
    loadComponent: () =>
      import('./pages/user-managment/user-managment').then((m) => m.UserManagementComponent),
  },
  {
    path: 'academic-year-managment',
    title: 'Manage Academic Years',
    loadComponent: () =>
      import('./pages/academic-year-managment/academic-year-managment').then(
        (m) => m.AcademicYearManagment,
      ),
  },
  {
    path: 'courses-managment',
    title: 'Configure Courses',
    loadComponent: () =>
      import('./pages/courses-managment/courses-managment').then((m) => m.CoursesManagment),
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'departments-managment',
    title: 'Department Management',
    loadComponent: () =>
      import('./pages/departments-managment/departments-managment').then(
        (m) => m.DepartmentsManagment,
      ),
  },
  {
    path: 'assign-courses-managment',
    title: 'Assign Courses',
    loadComponent: () =>
      import('./pages/assign-courses-managment/assign-courses-managment').then(
        (m) => m.AssignCoursesManagment,
      ),
  },
  {
    path: 'enroll-students-managment',
    title: 'Enroll Students',
    loadComponent: () =>
      import('./pages/enroll-students-managment/enroll-students-managment').then(
        (m) => m.EnrollStudentsManagment,
      ),
  },
  {
    path: 'reset-passwords',
    title: 'Reset Passwords',
    loadComponent: () =>
      import('../auth/pages/reset-passwords/reset-passwords').then((m) => m.ResetPasswords),
  },
  {
    path: 'system-settings-managment',
    title: 'System Settings',
    loadComponent: () =>
      import('./pages/system-settings-managment/system-settings-managment').then(
        (m) => m.SystemSettingsManagment,
      ),
  },
];
