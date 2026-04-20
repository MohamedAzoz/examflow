import { AUTH_ROUTES, ROUTESADMIN, ROUTESPROFESSOR, ROUTESSTUDENT } from '../constants/const.route';
import { NavItem } from '../../layout/nav-item';

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  {
    label: ROUTESADMIN.DASHBOARD.title,
    icon: 'pi-objects-column',
    route: ROUTESADMIN.DASHBOARD.path,
  },
  { label: ROUTESADMIN.USERS.title, icon: 'pi-users', route: ROUTESADMIN.USERS.path },
  { label: ROUTESADMIN.SEMESTERS.title, icon: 'pi-calendar', route: ROUTESADMIN.SEMESTERS.path },
  { label: ROUTESADMIN.COURSES.title, icon: 'pi-book', route: ROUTESADMIN.COURSES.path },
  {
    label: ROUTESADMIN.DEPARTMENTS.title,
    icon: 'pi-building',
    route: ROUTESADMIN.DEPARTMENTS.path,
  },
  {
    label: ROUTESADMIN.ASSIGN_COURSES.title,
    icon: 'pi-history',
    route: ROUTESADMIN.ASSIGN_COURSES.path,
  },
  {
    label: ROUTESADMIN.RESET_PASSWORDS.title,
    icon: 'pi-pen-to-square',
    route: ROUTESADMIN.RESET_PASSWORDS.path,
  },
  {
    label: ROUTESADMIN.ENROLL_STUDENTS.title,
    icon: 'pi-graduation-cap',
    route: ROUTESADMIN.ENROLL_STUDENTS.path,
  },

  {
    label: ROUTESADMIN.SYSTEM_SETTINGS.title,
    icon: 'pi-cog',
    route: ROUTESADMIN.SYSTEM_SETTINGS.path,
  },
] as const;

export const STUDENT_NAV_ITEMS: readonly NavItem[] = [
  {
    label: ROUTESSTUDENT.DASHBOARD.title,
    icon: 'pi-objects-column',
    route: ROUTESSTUDENT.DASHBOARD.path,
  },
  { label: ROUTESSTUDENT.COURSES.title, icon: 'pi-folder', route: ROUTESSTUDENT.COURSES.path },
  {
    label: ROUTESSTUDENT.PAST_RESULTS.title,
    icon: 'pi-chart-bar',
    route: ROUTESSTUDENT.PAST_RESULTS.path,
  },
  { label: ROUTESSTUDENT.SETTINGS.title, icon: 'pi-cog', route: ROUTESSTUDENT.SETTINGS.path },
] as const;

export const PROFESSOR_NAV_ITEMS: readonly NavItem[] = [
  {
    label: ROUTESPROFESSOR.DASHBOARD.title,
    icon: 'pi-objects-column',
    route: ROUTESPROFESSOR.DASHBOARD.path,
  },
  {
    label: ROUTESPROFESSOR.COURSES.title,
    icon: 'pi-book',
    route: ROUTESPROFESSOR.COURSES.path,
  },
  {
    label: ROUTESPROFESSOR.ANALYSIS.title,
    icon: 'pi-chart-bar',
    route: ROUTESPROFESSOR.ANALYSIS.path,
  },
  {
    label: ROUTESPROFESSOR.SETTINGS.title,
    icon: 'pi-cog',
    route: ROUTESPROFESSOR.SETTINGS.path,
  },
] as const;
