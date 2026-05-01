import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ROUTES, ROUTESPROFESSOR } from '../../../core/constants/const.route';
import { ProfessorFacade } from '../services/professor-facade';
import { FeatureActionCardComponent } from './components/feature-action-card/feature-action-card.component';
import { CourseHeroComponent } from './components/course-hero/course-hero.component';
import { OverviewStatCardComponent } from './components/overview-stat-card/overview-stat-card.component';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CourseHeroComponent,
    FeatureActionCardComponent,
    OverviewStatCardComponent,
  ],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.css',
})
export class CourseDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly professorFacade = inject(ProfessorFacade);

  protected readonly routes = ROUTES;
  protected readonly professorRoutes = ROUTESPROFESSOR;

  protected readonly resource = this.professorFacade.getCourseOverview;
  protected readonly resourceDetails = this.professorFacade.getCourseOverviewDetails;

  constructor() {
    effect(() => {
      const courseId = this.courseId();
      if (courseId !== null) {
        this.professorFacade.setCourseId(courseId);
      }
    });
  }

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly courseId = computed(() => {
    const rawId = this.params().get('courseId') ?? '';
    const parsed = Number(rawId);
    return Number.isFinite(parsed) ? parsed : null;
  });

  protected readonly course = computed(() => {
    const id = this.courseId();
    if (id === null) {
      return null;
    }

    return this.resource.value() ?? null;
  });

  protected readonly isLoading = computed(() => this.resource.isLoading());

  protected readonly errorMessage = computed(() => {
    const id = this.courseId();
    if (id === null) {
      return 'Invalid course id.';
    }

    return this.readHttpError(this.resource.error());
  });

  //#region resourceDetails

  protected readonly totalQuestions = computed(() => {
    const currentCourse = this.resourceDetails.value();
    if (!currentCourse) {
      return 0;
    }

    return currentCourse.totalQuestions;
  });

  protected readonly activeExams = computed(() => {
    const currentCourse = this.resourceDetails.value();
    if (!currentCourse) {
      return 0;
    }

    return currentCourse.activeExams;
  });

  protected readonly pendingGradingExams = computed(() => {
    const currentCourse = this.resourceDetails.value();
    if (!currentCourse) {
      return 0;
    }

    return currentCourse.pendingGradingExams;
  });

  protected readonly completedExams = computed(() => {
    const currentCourse = this.resourceDetails.value();
    if (!currentCourse) {
      return 0;
    }

    return currentCourse.completedExams;
  });

  //#endregion

  
  protected openExams(courseId: number): void {
    this.router.navigate([
      '/',
      this.routes.MAIN.path,
      this.routes.PROFESSOR.path,
      this.professorRoutes.COURSES.path,
      courseId,
      'exams',
    ]);
  }

  protected openQuestionBank(courseId: number): void {
    this.router.navigate([
      '/',
      this.routes.MAIN.path,
      this.routes.PROFESSOR.path,
      this.professorRoutes.COURSES.path,
      courseId,
      'question-bank',
    ]);
  }

  private readHttpError(error: unknown): string | null {
    if (!error) {
      return null;
    }

    if (error instanceof HttpErrorResponse) {
      const backendError = error.error as Record<string, unknown> | null;
      const message = backendError?.['errorMessage'] ?? backendError?.['message'];

      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }

      return error.message || 'Failed to load course details.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Failed to load course details.';
  }
}
