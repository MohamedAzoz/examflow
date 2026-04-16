import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IJWT } from '../../../data/models/auth/ijwt';
import { IdentityService } from '../../../core/services/identity-service';
import { JWT } from '../../../core/services/jwt';
import { ProfessorFacade } from '../services/professor-facade';
import { CourseCardComponent } from './components/course-card/course-card.component';

@Component({
  selector: 'app-my-courses',
  imports: [CommonModule, ButtonModule, CourseCardComponent],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.css',
})
export class MyCoursesComponent implements OnInit {
  private readonly identityService = inject(IdentityService);
  private readonly jwt = inject(JWT);
  private readonly professorFacade = inject(ProfessorFacade);

  private readonly localError = signal<string | null>(null);

  protected readonly resource = this.professorFacade.getAssignedCourses;

  protected readonly assignedCourses = computed(() => this.resource.value()?.assignedCourses ?? []);

  protected readonly isLoading = computed(() => this.resource.isLoading());

  protected readonly errorMessage = computed(() => {
    const localError = this.localError();
    if (localError) {
      return localError;
    }
    return this.readHttpError(this.resource.error());
  });

  ngOnInit(): void {
    this.professorFacade.setProfessorId();
  }

  protected retryLoad(): void {
    this.localError.set(null);
    this.resource.reload();
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

      return error.message || 'Failed to load assigned courses.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Failed to load assigned courses.';
  }
}
