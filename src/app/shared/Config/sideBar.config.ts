import { NavItem } from '../../layout/nav-item';

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'Dashboard.svg', route: 'dashboard' },
  { label: 'Manage Users', icon: 'User Management.svg', route: 'manage-users' },
  { label: 'Manage Academic Years', icon: 'Manage Academic Years.svg', route: 'academic-years' },
  { label: 'Configure Courses', icon: 'Configure Courses.svg', route: 'configure-courses' },
  { label: 'Add Department', icon: 'Add Department.svg', route: 'add-department' },
  { label: 'Assign Courses', icon: 'Assign Courses.svg', route: 'assign-courses' },
  { label: 'Reset Passwords', icon: 'Reset Passwords.svg', route: 'reset-passwords' },
  { label: 'Enroll Students', icon: 'Enroll Students.svg', route: 'enroll-students' },
  { label: 'System Settings', icon: 'System Settings.svg', route: 'system-settings' },
] as const;

export const STUDENT_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'bi-grid-1x2', route: 'dashboard' },
  { label: 'Courses', icon: 'bi-folder', route: 'courses' },
  { label: 'Results', icon: 'bi-file-earmark-text', route: 'results' },
  { label: 'Settings', icon: 'bi-gear', route: 'settings' },
] as const;