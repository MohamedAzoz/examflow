import { NavItem } from '../../layout/nav-item';

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'Dashboard.svg', route: 'coming-soon' },
  { label: 'Manage Users', icon: 'User Management.svg', route: 'user-managment' },
  { label: 'Manage Semesters', icon: 'Manage Academic Years.svg', route: 'semester-managment' },
  { label: 'Configure Courses', icon: 'Configure Courses.svg', route: 'courses-managment' },
  { label: 'Add Department', icon: 'Add Department.svg', route: 'departments-managment' },
  { label: 'Assign Courses', icon: 'Assign Courses.svg', route: 'assign-courses-managment' },
  { label: 'Reset Passwords', icon: 'Reset Passwords.svg', route: 'coming-soon' },
  { label: 'Enroll Students', icon: 'Enroll Students.svg', route: 'coming-soon' },
  { label: 'System Settings', icon: 'System Settings.svg', route: 'coming-soon' },
] as const;

export const STUDENT_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Student Dashboard', icon: 'bi-grid-1x2', route: 'stdashboard' },
  { label: 'Courses', icon: 'bi-folder', route: 'coming-soon' },
  { label: 'My Results', icon: 'bi-file-earmark-text', route: 'past-results' },
  { label: 'Settings', icon: 'bi-gear', route: 'coming-soon' },
] as const;
