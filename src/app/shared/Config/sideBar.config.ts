import { NavItem } from '../../layout/nav-item';

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'bi-grid-1x2', route: 'dashboard' },
  { label: 'Manage Users', icon: 'bi-people', route: 'manage-users' },
  { label: 'Manage Academic Years', icon: 'bi-calendar3', route: 'academic-years' },
  { label: 'Configure Courses', icon: 'bi-book', route: 'configure-courses' },
  { label: 'Add Department', icon: 'bi-building', route: 'add-department' },
  { label: 'Assign Courses', icon: 'bi-diagram-3', route: 'assign-courses' },
  { label: 'Reset Passwords', icon: 'bi-arrow-counterclockwise', route: 'reset-passwords' },
  { label: 'Enroll Students', icon: 'bi-mortarboard', route: 'enroll-students' },
  { label: 'System Settings', icon: 'bi-gear', route: 'system-settings' },
] as const;

export const STUDENT_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'bi-grid-1x2', route: 'dashboard' },
  { label: 'Courses', icon: 'bi-folder', route: 'courses' },
  { label: 'Results', icon: 'bi-file-earmark-text', route: 'results' },
  { label: 'Settings', icon: 'bi-gear', route: 'settings' },
] as const;