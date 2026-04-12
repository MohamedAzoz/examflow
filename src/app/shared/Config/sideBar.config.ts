import { NavItem } from '../../layout/nav-item';

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: 'pi-objects-column', route: 'dashboard' },
  { label: 'Manage Users', icon: 'pi-users', route: 'user-managment' },
  { label: 'Manage Semesters', icon: 'pi-calendar', route: 'semester-managment' },
  { label: 'Configure Courses', icon: 'pi-book', route: 'courses-managment' },
  { label: 'Add Department', icon: 'pi-building', route: 'departments-managment' },
  { label: 'Assign Courses', icon: 'pi-history', route: 'assign-courses-managment' },
  { label: 'Reset Passwords', icon: 'pi-pen-to-square', route: 'reset-passwords-managment' },
  { label: 'Enroll Students', icon: 'pi-graduation-cap', route: 'enroll-students-managment' },
  { label: 'System Settings', icon: 'pi-cog', route: 'system-settings-managment' },
] as const;

export const STUDENT_NAV_ITEMS: readonly NavItem[] = [
  { label: 'Student Dashboard', icon: 'pi-objects-column', route: 'stdashboard' },
  { label: 'Courses', icon: 'pi-folder', route: 'courses' },
  { label: 'My Results', icon: 'pi-chart-bar', route: 'past-results' },
  { label: 'Settings', icon: 'pi-cog', route: 'settings' },
] as const;
