import { CanDeactivateFn, Routes } from '@angular/router';
import { ExamSessionComponent } from './exam-session/exam-session';

export const canDeactivateExamSessionGuard: CanDeactivateFn<ExamSessionComponent> = (
  component,
) => component.canDeactivate();

export const studentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'stdashboard',
        pathMatch: 'full',
      },
      {
        path: 'stdashboard',
        title: 'Student Dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'exam/:examId',
        title: 'Exam Session',
        canDeactivate: [canDeactivateExamSessionGuard],
        loadComponent: () =>
          import('./exam-session/exam-session').then((m) => m.ExamSessionComponent),
      },
      {
        path: 'past-results',
        title: 'Past Results',
        loadComponent: () =>
          import('./past-results/past-results.component').then((m) => m.PastResultsComponent),
      },
      {
        path: 'past-results/:examId',
        title: 'Exam Result',
        loadComponent: () =>
          import('./exam-result/exam-result').then((m) => m.ExamResultComponent),
      },
    ],
  },
];
