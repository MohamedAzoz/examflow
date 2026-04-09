import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role-guard';

export const adminRoles: Routes = [
  { path: '', redirectTo: 'user-managment', pathMatch: 'full' },
  {
    path: 'user-managment',
    title: 'User Managment',
    loadComponent: () =>
      import('./user-managment/user-managment').then((m) => m.UserManagementComponent),
  },
  {
    path: 'semester-managment',
    title: 'Manage Semesters',
    loadComponent: () =>
      import('./semester-managment/semester-managment').then((m) => m.SemesterManagment),
  },
  {
    path: 'courses-managment',
    title: 'Configure Courses',
    loadComponent: () =>
      import('./courses-managment/courses-managment').then((m) => m.CoursesManagment),
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'departments-managment',
    title: 'Department Management',
    loadComponent: () =>
      import('./departments-managment/departments-managment').then((m) => m.DepartmentsManagment),
  },
  {
    path: 'assign-courses-managment',
    title: 'Assign Courses',
    loadComponent: () =>
      import('./assign-courses-managment/assign-courses-managment').then(
        (m) => m.AssignCoursesManagment,
      ),
  },
  {
    path: 'enroll-students-managment',
    title: 'Enroll Students',
    loadComponent: () =>
      import('./enroll-students-managment/enroll-students-managment').then(
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
      import('./system-settings-managment/system-settings-managment').then(
        (m) => m.SystemSettingsManagment,
      ),
  },
];
