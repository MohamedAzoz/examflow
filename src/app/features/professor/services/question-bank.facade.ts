import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { QuestionType } from '../../../data/enums/question-type';
import { IGetQuestion } from '../../../data/models/question/IGetQuestion';
import { IQuestionImport } from '../../../data/models/question/iquestion-import';
import { IQuestionRequest } from '../../../data/models/question/iquestion-request';
import { IQuestionResponse } from '../../../data/models/question/iquestion-response';
import { Question } from '../../../data/services/question';

export interface QuestionBankQueryState {
  courseId: number;
  questionType: QuestionType;
  searchTerm: string;
  pageIndex: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionBankFacade {
  private readonly questionService = inject(Question);

  readonly questions = signal<IQuestionResponse[]>([]);

  readonly filters = signal<QuestionBankQueryState>({
    courseId: 0,
    questionType: QuestionType.Unknown,
    searchTerm: '',
    pageIndex: 1,
    pageSize: 5,
  });

  readonly normalizedFilters = computed<QuestionBankQueryState>(() => {
    const state = this.filters();

    return {
      courseId: this.normalizeCourseId(state.courseId),
      questionType: this.normalizeQuestionType(state.questionType),
      searchTerm: state.searchTerm.trim(),
      pageIndex: this.normalizePositiveInt(state.pageIndex, 1),
      pageSize: this.normalizePositiveInt(state.pageSize, 5),
    };
  });

  readonly questionsRequest = computed<IGetQuestion>(() => {
    const state = this.normalizedFilters();

    return {
      QuestionTextSearch: state.searchTerm,
      QuestionType: state.questionType,
      ...(state.courseId > 0 ? { CourseId: state.courseId } : {}),
      PageIndex: state.pageIndex,
      PageSize: state.pageSize,
    };
  });

  readonly hasMore = signal(false);
  readonly loadingQuestions = signal(false);
  readonly mutatingQuestion = signal(false);
  readonly importingQuestions = signal(false);
  readonly error = signal<string | null>(null);

  setCourseId(courseId: number): void {
    const normalizedCourseId = this.normalizeCourseId(courseId);

    this.filters.update((current) => {
      if (current.courseId === normalizedCourseId) {
        return current;
      }

      return {
        ...current,
        courseId: normalizedCourseId,
        pageIndex: 1,
      };
    });
  }

  updateFilters(patch: Partial<QuestionBankQueryState>): void {
    this.filters.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  reloadQuestions(): Observable<IQuestionResponse[]> {
    const request = this.questionsRequest();

    this.loadingQuestions.set(true);
    this.error.set(null);

    return this.questionService.getAllQuestions(request).pipe(
      tap((questions) => {
        const safeQuestions = Array.isArray(questions) ? questions : [];

        this.questions.set(safeQuestions);
        this.hasMore.set(safeQuestions.length >= request.PageSize);
      }),
      catchError((error) => this.handleError(error, 'Failed to load question bank.')),
      finalize(() => this.loadingQuestions.set(false)),
    );
  }

  createQuestion(payload: IQuestionRequest): Observable<unknown> {
    this.mutatingQuestion.set(true);
    this.error.set(null);

    return this.questionService.createQuestions(payload).pipe(
      switchMap((response) => this.reloadQuestions().pipe(map(() => response))),
      catchError((error) => this.handleError(error, 'Failed to create question.')),
      finalize(() => this.mutatingQuestion.set(false)),
    );
  }

  updateQuestion(questionId: number, payload: IQuestionRequest): Observable<unknown> {
    this.mutatingQuestion.set(true);
    this.error.set(null);

    const requestPayload: IQuestionResponse = {
      id: questionId,
      text: payload.text,
      questionType: payload.questionType,
      degree: payload.degree,
      courseId: payload.courseId,
      options: payload.options,
      correctOptionText: payload.correctOptionText,
    };

    return this.questionService.putQuestions(requestPayload).pipe(
      switchMap((response) => this.reloadQuestions().pipe(map(() => response))),
      catchError((error) => this.handleError(error, 'Failed to update question.')),
      finalize(() => this.mutatingQuestion.set(false)),
    );
  }

  deleteQuestion(questionId: number): Observable<unknown> {
    this.mutatingQuestion.set(true);
    this.error.set(null);

    return this.questionService.deleteQuestions(questionId).pipe(
      switchMap((response) => this.reloadQuestions().pipe(map(() => response))),
      catchError((error) => this.handleError(error, 'Failed to delete question.')),
      finalize(() => this.mutatingQuestion.set(false)),
    );
  }

  importQuestions(payload: IQuestionImport): Observable<unknown> {
    this.importingQuestions.set(true);
    this.error.set(null);

    return this.questionService.importQuestions(payload).pipe(
      switchMap((response) => this.reloadQuestions().pipe(map(() => response))),
      catchError((error) => this.handleError(error, 'Failed to import questions.')),
      finalize(() => this.importingQuestions.set(false)),
    );
  }

  private handleError(error: unknown, fallbackMessage: string): Observable<never> {
    this.error.set(this.resolveErrorMessage(error, fallbackMessage));
    return throwError(() => error);
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }

      const backend = error.error as Record<string, unknown> | null;
      const message = backend?.['errorMessage'] ?? backend?.['message'] ?? backend?.['title'];

      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }

      return error.message || fallbackMessage;
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return fallbackMessage;
  }

  private normalizePositiveInt(value: number, fallback: number): number {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
  }

  private normalizeCourseId(value: number): number {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  private normalizeQuestionType(value: QuestionType): QuestionType {
    switch (value) {
      case QuestionType.MultipleChoice:
      case QuestionType.TrueFalse:
      case QuestionType.Essay:
      case QuestionType.Unknown:
        return value;
      default:
        return QuestionType.Unknown;
    }
  }
}
