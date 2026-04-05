import { Routes } from '@angular/router';

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
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'exam',
        children: [
          {
            path: '',
            title: 'Exam Session',
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
        title: 'Past Results',
        loadComponent: () =>
          import('./pages/past-results/past-results.component').then((m) => m.PastResultsComponent),
      },
      {
        path: 'past-results/:examId',
        title: 'Exam Result',
        loadComponent: () =>
          import('./pages/exam-result/exam-result').then((m) => m.ExamResultComponent),
      },
    ],
  },
];
