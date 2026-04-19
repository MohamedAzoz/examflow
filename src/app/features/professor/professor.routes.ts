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
        path: ROUTESPROFESSOR.QUESTION_BANK.path,
        title: ROUTESPROFESSOR.QUESTION_BANK.title,
        loadComponent: () =>
          import('./question-bank/question-bank.component').then(
            (m) => m.ProfessorQuestionBankComponent,
          ),
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
      {
        path: ROUTESPROFESSOR.COURSE_EXAM_GRADING.path,
        title: ROUTESPROFESSOR.COURSE_EXAM_GRADING.title,
        loadComponent: () =>
          import('./exams-management/components/essay-grading/essay-grading.component').then(
            (m) => m.EssayGradingComponent,
          ),
      },  {
        path: ROUTESPROFESSOR.DASHBOARD.path,
        title: ROUTESPROFESSOR.DASHBOARD.title,
        loadComponent: () =>
          import('./dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: ROUTESPROFESSOR.ANALYSIS.path,
        title: ROUTESPROFESSOR.ANALYSIS.title,
        loadComponent: () =>
          import('./analysis/analysis').then((m) => m.Analysis),
      },
      {
        path: ROUTESPROFESSOR.SETTINGS.path,
        title: ROUTESPROFESSOR.SETTINGS.title,
        loadComponent: () =>
          import('./settings/settings').then((m) => m.Settings),
      },
    ],
  },
];
