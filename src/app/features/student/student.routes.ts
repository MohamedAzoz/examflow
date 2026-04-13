import { CanDeactivateFn, Routes } from '@angular/router';
import { ExamSessionComponent } from './exam-session/exam-session';
import { ROUTESSTUDENT } from '../../core/constants/const.route';

export const canDeactivateExamSessionGuard: CanDeactivateFn<ExamSessionComponent> = (component) =>
  component.canDeactivate();

export const studentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: ROUTESSTUDENT.DASHBOARD.path,
        pathMatch: 'full',
      },
      {
        path: ROUTESSTUDENT.DASHBOARD.path,
        title: ROUTESSTUDENT.DASHBOARD.title,
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: ROUTESSTUDENT.EXAM.path,
        title: ROUTESSTUDENT.EXAM.title,
        canDeactivate: [canDeactivateExamSessionGuard],
        loadComponent: () =>
          import('./exam-session/exam-session').then((m) => m.ExamSessionComponent),
      },
      {
        path: ROUTESSTUDENT.PAST_RESULTS.path,
        title: ROUTESSTUDENT.PAST_RESULTS.title,
        loadComponent: () =>
          import('./past-results/past-results.component').then((m) => m.PastResultsComponent),
      },
      {
        path: ROUTESSTUDENT.EXAM_RESULT.path,
        title: ROUTESSTUDENT.EXAM_RESULT.title,
        loadComponent: () => import('./exam-result/exam-result').then((m) => m.ExamResultComponent),
      },
      {
        path: ROUTESSTUDENT.COURSES.path,
        title: ROUTESSTUDENT.COURSES.title,
        loadComponent: () => import('./courses/courses').then((m) => m.Courses),
      },
      {
        path: ROUTESSTUDENT.SETTINGS.path,
        title: ROUTESSTUDENT.SETTINGS.title,
        loadComponent: () => import('./settings/settings').then((m) => m.Settings),
      },
    ],
  },
];
