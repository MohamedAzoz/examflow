import { Routes } from '@angular/router';

export const studentRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'exam',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/exam-session/exam-session').then((m) => m.ExamSessionComponent),
          },
          {
            path: ':examId/:qId',
            loadComponent: () =>
              import('./pages/exam-session/exam-session').then((m) => m.ExamSessionComponent),
          },
        ],
      },
      {
        path: 'past-results',
        loadComponent: () =>
          import('./pages/past-results/past-results.component').then((m) => m.PastResultsComponent),
      },
      {
        path: 'past-results/:examId',
        loadComponent: () =>
          import('./pages/exam-result/exam-result').then((m) => m.ExamResultComponent),
      },
    ],
  },
];
