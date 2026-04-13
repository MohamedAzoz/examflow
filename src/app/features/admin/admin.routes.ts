import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role-guard';
import { ROUTESADMIN } from '../../core/constants/const.route';

export const adminRoles: Routes = [
  { path: '', redirectTo: ROUTESADMIN.DASHBOARD.path, pathMatch: 'full' },
  {
    path: ROUTESADMIN.USERS.path,
    title: ROUTESADMIN.USERS.title,
    loadComponent: () =>
      import('./user-managment/user-managment').then((m) => m.UserManagementComponent),
  },
  {
    path: ROUTESADMIN.SEMESTERS.path,
    title: ROUTESADMIN.SEMESTERS.title,
    loadComponent: () =>
      import('./semester-managment/semester-managment').then((m) => m.SemesterManagment),
  },
  {
    path: ROUTESADMIN.COURSES.path,
    title: ROUTESADMIN.COURSES.title,
    loadComponent: () =>
      import('./courses-managment/courses-managment').then((m) => m.CoursesManagment),
  },
  {
    path: ROUTESADMIN.DASHBOARD.path,
    title: ROUTESADMIN.DASHBOARD.title,
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: ROUTESADMIN.DEPARTMENTS.path,
    title: ROUTESADMIN.DEPARTMENTS.title,
    loadComponent: () =>
      import('./departments-managment/departments-managment').then((m) => m.DepartmentsManagment),
  },
  {
    path: ROUTESADMIN.ASSIGN_COURSES.path,
    title: ROUTESADMIN.ASSIGN_COURSES.title,
    loadComponent: () =>
      import('./assign-courses-managment/assign-courses-managment').then(
        (m) => m.AssignCoursesManagment,
      ),
  },
  {
    path: ROUTESADMIN.ENROLL_STUDENTS.path,
    title: ROUTESADMIN.ENROLL_STUDENTS.title,
    loadComponent: () =>
      import('./enroll-students-managment/enroll-students-managment').then(
        (m) => m.EnrollStudentsManagment,
      ),
  },
  {
    path: ROUTESADMIN.RESET_PASSWORDS.path,
    title: ROUTESADMIN.RESET_PASSWORDS.title,
    loadComponent: () =>
      import('../auth/pages/reset-passwords/reset-passwords').then((m) => m.ResetPasswords),
  },
  {
    path: ROUTESADMIN.SYSTEM_SETTINGS.path,
    title: ROUTESADMIN.SYSTEM_SETTINGS.title,
    loadComponent: () =>
      import('./system-settings-managment/system-settings-managment').then(
        (m) => m.SystemSettingsManagment,
      ),
  },
];
