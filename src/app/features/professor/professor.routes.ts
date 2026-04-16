import { Routes } from '@angular/router';
import { ROUTESPROFESSOR } from '../../core/constants/const.route';

export const professorRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: ROUTESPROFESSOR.COURSES.path,
        pathMatch: 'full',
      },
      {
        path: ROUTESPROFESSOR.COURSES.path,
        title: ROUTESPROFESSOR.COURSES.title,
        loadComponent: () =>
          import('./my-courses/my-courses.component').then((m) => m.MyCoursesComponent),
      },
    ],
  },
];
