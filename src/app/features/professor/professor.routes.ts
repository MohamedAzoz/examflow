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
        path: ROUTESPROFESSOR.COURSE_EXAMS.path,
        title: ROUTESPROFESSOR.COURSE_EXAMS.title,
        loadComponent: () =>
          import('./exams-management/exams-management.component').then(
            (m) => m.ExamsManagementComponent,
          ),
      },
      {
        path: ROUTESPROFESSOR.COURSE_EXAM_BUILDER.path,
        title: ROUTESPROFESSOR.COURSE_EXAM_BUILDER.title,
        loadComponent: () =>
          import('./exam-builder/exam-builder.component').then((m) => m.ExamBuilderComponent),
      },
      {
        path: ROUTESPROFESSOR.COURSE_DETAILS.path,
        title: ROUTESPROFESSOR.COURSE_DETAILS.title,
        loadComponent: () =>
          import('./course-details/course-details.component').then((m) => m.CourseDetailsComponent),
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
