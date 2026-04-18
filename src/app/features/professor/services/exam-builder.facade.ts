import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { QuestionType } from '../../../data/enums/question-type';
import { IExamQuestions } from '../../../data/models/ExamQuestions/iexam-questions';
import { IassignDepartments } from '../../../data/models/course/IassignDepartments';
import { IexamByIddetails } from '../../../data/models/ProfessorExam/Iexamdetails.2';
import { IupdateExam } from '../../../data/models/ProfessorExam/IupdateExam';
import { IcreateExam } from '../../../data/models/ProfessorExam/icreate-exam';
import { IGetQuestion } from '../../../data/models/question/IGetQuestion';
import { IQuestionRequest } from '../../../data/models/question/iquestion-request';
import { IQuestionResponse } from '../../../data/models/question/iquestion-response';
import { Course } from '../../../data/services/course';
import { ExamQuestions } from '../../../data/services/exam-questions';
import { ProfessorExam } from '../../../data/services/professor-exam';
import { Question } from '../../../data/services/question';

export interface ExamBuilderQuestionBankState {
  items: IQuestionResponse[];
  pageIndex: number;
  pageSize: number;
  search: string;
  type: QuestionType;
  hasMore: boolean;
  totalLoaded: number;
}

export interface ExamBuilderCurrentExam {
  id: number;
  title: string;
  passingScore: number;
  startTime: Date;
  durationMinutes: number;
  totalDegree: number;
  isRandomQuestions: boolean;
  isRandomAnswers: boolean;
  examStatus: string;
  academicLevel: number;
  semesterName: string;
  courseName: string;
  departmentIds: number[];
  departmentNames: string[];
}

export interface ExamBuilderWorkspaceData {
  exam: ExamBuilderCurrentExam;
  assignedQuestions: IExamQuestions[];
}

export type ExamBuilderCreateExamData = IcreateExam;
export type ExamBuilderCreateQuestionData = IQuestionRequest;

export interface ExamBuilderUpdateQuestionData {
  text: string;
  questionType: number;
  degree: number;
  options: string[];
  correctOptionText: string;
  courseId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExamBuilderFacade {
  private static readonly DEFAULT_PAGE_SIZE = 12;

  private readonly professorExamService = inject(ProfessorExam);
  private readonly questionService = inject(Question);
  private readonly examQuestionsService = inject(ExamQuestions);
  private readonly courseService = inject(Course);

  private questionBankRequestToken = 0;

  readonly currentCourseId = signal<number | null>(null);
  readonly currentExamId = signal<number | null>(null);

  readonly currentExam = signal<ExamBuilderCurrentExam | null>(null);
  readonly assignedQuestions = signal<IExamQuestions[]>([]);
  readonly departments = signal<IassignDepartments[]>([]);

  readonly questionBank = signal<ExamBuilderQuestionBankState>({
    items: [],
    pageIndex: 1,
    pageSize: ExamBuilderFacade.DEFAULT_PAGE_SIZE,
    search: '',
    type: QuestionType.Unknown,
    hasMore: true,
    totalLoaded: 0,
  });

  readonly loadingExam = signal(false);
  readonly loadingQuestionBank = signal(false);
  readonly loadingAssignedQuestions = signal(false);
  readonly loadingDepartments = signal(false);
  readonly mutatingQuestions = signal(false);
  readonly savingExam = signal(false);
  readonly publishingExam = signal(false);
  readonly error = signal<string | null>(null);

  setContext(courseId: number | null, examId: number | null): void {
    this.currentCourseId.set(courseId && courseId > 0 ? courseId : null);
    this.currentExamId.set(examId && examId > 0 ? examId : null);
  }

  setCourseId(courseId: number | null): void {
    this.currentCourseId.set(courseId && courseId > 0 ? courseId : null);
  }

  resetQuestionBank(): void {
    this.questionBankRequestToken += 1;
    this.questionBank.set({
      items: [],
      pageIndex: 1,
      pageSize: ExamBuilderFacade.DEFAULT_PAGE_SIZE,
      search: '',
      type: QuestionType.Unknown,
      hasMore: true,
      totalLoaded: 0,
    });
    this.loadingQuestionBank.set(false);
  }

  setAssignedQuestions(questions: IExamQuestions[]): void {
    this.assignedQuestions.set(questions ?? []);
  }

  loadExamWorkspace(): Observable<ExamBuilderWorkspaceData> {
    const examId = this.currentExamId();
    const courseId = this.currentCourseId();

    if (!examId || !courseId) {
      const message = 'Course id and exam id are required before loading exam workspace.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    this.loadingExam.set(true);
    this.error.set(null);

    return this.professorExamService.getExamById(examId).pipe(
      map((response) => {
        const exam = this.mapExamByIdToCurrentExam(examId, response);
        const assignedQuestions = this.mapExamQuestionsToAssigned(courseId, response);
        return { exam, assignedQuestions };
      }),
      tap((workspace) => {
        this.currentExam.set(workspace.exam);
        this.assignedQuestions.set(workspace.assignedQuestions);
      }),
      catchError((error) => this.handleError(error, 'Failed to load exam workspace.')),
      finalize(() => this.loadingExam.set(false)),
    );
  }

  loadCourseDepartments(courseId = this.currentCourseId()): Observable<IassignDepartments[]> {
    if (!courseId || courseId <= 0) {
      this.departments.set([]);
      return of([]);
    }

    this.loadingDepartments.set(true);
    this.error.set(null);

    return this.courseService.assignDepartments(courseId).pipe(
      tap((departments) => this.departments.set(departments ?? [])),
      catchError((error) => this.handleError(error, 'Failed to load course departments.')),
      finalize(() => this.loadingDepartments.set(false)),
    );
  }

  updateExamSettings(payload: IupdateExam): Observable<unknown> {
    this.savingExam.set(true);
    this.error.set(null);

    return this.professorExamService.updateExam(payload).pipe(
      tap(() => {
        this.currentExam.update((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            title: payload.title,
            passingScore: payload.passingScore,
            startTime: new Date(payload.startTime),
            durationMinutes: payload.durationMinutes,
            totalDegree: payload.totalDegree,
            isRandomQuestions: payload.isRandomQuestions,
            isRandomAnswers: payload.isRandomAnswers,
            academicLevel: payload.academicLevel,
            departmentIds: [payload.departmentId],
          };
        });
      }),
      catchError((error) => this.handleError(error, 'Failed to update exam settings.')),
      finalize(() => this.savingExam.set(false)),
    );
  }

  publishExam(examId = this.currentExamId()): Observable<unknown> {
    if (!examId || examId <= 0) {
      const message = 'Exam id is required before publishing exam.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    this.publishingExam.set(true);
    this.error.set(null);

    return this.professorExamService.publishExam(examId).pipe(
      tap(() => {
        this.currentExam.update((current) =>
          current ? { ...current, examStatus: 'Published' } : current,
        );
      }),
      catchError((error) => this.handleError(error, 'Failed to publish exam.')),
      finalize(() => this.publishingExam.set(false)),
    );
  }

  loadQuestions(
    pageIndex: number,
    pageSize: number,
    search = '',
    type: QuestionType = QuestionType.Unknown,
  ): Observable<IQuestionResponse[]> {
    const courseId = this.currentCourseId();
    if (!courseId || courseId <= 0) {
      const message = 'Course id is required before loading question bank.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    const safePageIndex = this.normalizePageIndex(pageIndex);
    const safePageSize = this.normalizePageSize(pageSize);
    const normalizedSearch = search.trim();
    const requestToken = ++this.questionBankRequestToken;

    this.loadingQuestionBank.set(true);
    this.error.set(null);

    const request: IGetQuestion = {
      QuestionTextSearch: normalizedSearch,
      QuestionType: type,
      CourseId: courseId,
      PageIndex: safePageIndex,
      PageSize: safePageSize,
    };

    return this.questionService.getAllQuestions(request).pipe(
      tap((response) => {
        if (requestToken !== this.questionBankRequestToken) {
          return;
        }

        const items = Array.isArray(response) ? response : [];
        const current = this.questionBank();
        const mergedItems =
          safePageIndex === 1 ? items : this.mergeQuestionsById(current.items, items);

        this.questionBank.set({
          items: mergedItems,
          pageIndex: safePageIndex,
          pageSize: safePageSize,
          search: normalizedSearch,
          type,
          hasMore: items.length >= safePageSize,
          totalLoaded: mergedItems.length,
        });
      }),
      catchError((error) => this.handleError(error, 'Failed to load question bank.')),
      finalize(() => {
        if (requestToken === this.questionBankRequestToken) {
          this.loadingQuestionBank.set(false);
        }
      }),
    );
  }

  loadAssignedQuestions(examId = this.currentExamId()): Observable<IExamQuestions[]> {
    if (!examId || examId <= 0) {
      const message = 'Exam id is required before loading assigned questions.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    this.loadingAssignedQuestions.set(true);
    this.error.set(null);

    return this.examQuestionsService.getExamQuestions(examId).pipe(
      tap((questions) => this.assignedQuestions.set(questions ?? [])),
      catchError((error) => this.handleError(error, 'Failed to load assigned questions.')),
      finalize(() => this.loadingAssignedQuestions.set(false)),
    );
  }

  assignQuestionsToExam(examId: number, questionIds: number[]): Observable<IExamQuestions[]> {
    const uniqueIds = this.uniquePositiveIds(questionIds);
    if (uniqueIds.length === 0) {
      return of(this.assignedQuestions());
    }

    this.mutatingQuestions.set(true);
    this.error.set(null);

    return this.examQuestionsService.assignQuestionsToExam(examId, uniqueIds).pipe(
      switchMap(() => this.loadAssignedQuestions(examId)),
      catchError((error) => this.handleError(error, 'Failed to assign questions to exam.')),
      finalize(() => this.mutatingQuestions.set(false)),
    );
  }

  createQuestion(questionData: ExamBuilderCreateQuestionData): Observable<unknown> {
    this.mutatingQuestions.set(true);
    this.error.set(null);

    return this.questionService.createQuestions(questionData).pipe(
      catchError((error) => this.handleError(error, 'Failed to create question.')),
      finalize(() => this.mutatingQuestions.set(false)),
    );
  }

  updateQuestion(
    questionId: number,
    questionData: ExamBuilderUpdateQuestionData,
  ): Observable<unknown> {
    const courseId = this.resolveCourseId(questionData.courseId);
    if (!courseId) {
      const message = 'Course id is required before updating question.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    this.mutatingQuestions.set(true);
    this.error.set(null);

    const payload: IQuestionResponse = {
      id: questionId,
      text: questionData.text,
      questionType: questionData.questionType,
      degree: this.normalizeDegree(questionData.degree),
      courseId,
      options: questionData.options ?? [],
      correctOptionText: questionData.correctOptionText ?? '',
    };

    return this.questionService.putQuestions(payload).pipe(
      tap(() => {
        this.questionBank.update((state) => ({
          ...state,
          items: state.items.map((question) =>
            question.id === questionId ? { ...question, ...payload } : question,
          ),
        }));
      }),
      catchError((error) => this.handleError(error, 'Failed to update question.')),
      finalize(() => this.mutatingQuestions.set(false)),
    );
  }

  uploadQuestionMedia(file: File): Observable<string | null> {
    const courseId = this.currentCourseId();
    if (!courseId || courseId <= 0) {
      const message = 'Course id is required before uploading question media.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    this.mutatingQuestions.set(true);
    this.error.set(null);

    return this.questionService.uploadMediaQuestions({ file, courseId }).pipe(
      map((response) => this.extractMediaPath(response)),
      catchError((error) => this.handleError(error, 'Failed to upload media for question.')),
      finalize(() => this.mutatingQuestions.set(false)),
    );
  }

  private mapExamByIdToCurrentExam(examId: number, exam: IexamByIddetails): ExamBuilderCurrentExam {
    return {
      id: examId,
      title: exam.title,
      passingScore: exam.passingScore,
      startTime: new Date(exam.startTime),
      durationMinutes: exam.durationMinutes,
      totalDegree: exam.totalDegree,
      isRandomQuestions: exam.isRandomQuestions,
      isRandomAnswers: exam.isRandomAnswers,
      examStatus: exam.examStatus,
      academicLevel: exam.academicLevel,
      semesterName: exam.semesterName,
      courseName: exam.courseName,
      departmentIds: exam.examDepartments?.map((department) => department.departmentId) ?? [],
      departmentNames: exam.examDepartments?.map((department) => department.departmentName) ?? [],
    };
  }

  private mapExamQuestionsToAssigned(courseId: number, exam: IexamByIddetails): IExamQuestions[] {
    const sourceQuestions = exam.examQuestions ?? [];

    return sourceQuestions.map((question) => ({
      id: question.id,
      text: question.text,
      imagePath: question.imagePath,
      questionType: question.questionType,
      degree: question.degree,
      courseId,
      options: (question.questionOptions ?? []).map((option) => option.optionText),
      correctOptionText: question.correctOption?.optionText ?? '',
    }));
  }

  private normalizePageIndex(value: number): number {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }

  private normalizePageSize(value: number): number {
    return Number.isFinite(value) && value > 0
      ? Math.floor(value)
      : ExamBuilderFacade.DEFAULT_PAGE_SIZE;
  }

  private normalizeDegree(value: number): number {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }

  private resolveCourseId(explicitCourseId?: number): number | null {
    if (Number.isFinite(explicitCourseId) && Number(explicitCourseId) > 0) {
      return Number(explicitCourseId);
    }

    const current = this.currentCourseId();
    return current && current > 0 ? current : null;
  }

  private uniquePositiveIds(ids: number[]): number[] {
    const unique = new Set<number>();

    for (const id of ids) {
      if (Number.isFinite(id) && id > 0) {
        unique.add(id);
      }
    }

    return Array.from(unique);
  }

  private mergeQuestionsById(
    current: IQuestionResponse[],
    incoming: IQuestionResponse[],
  ): IQuestionResponse[] {
    const merged = new Map<number, IQuestionResponse>();

    for (const question of current) {
      merged.set(question.id, question);
    }

    for (const question of incoming) {
      merged.set(question.id, question);
    }

    return Array.from(merged.values());
  }

  private extractMediaPath(response: unknown): string | null {
    if (typeof response === 'string' && response.trim().length > 0) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return null;
    }

    const payload = response as Record<string, unknown>;
    const directCandidates = [
      payload['imagePath'],
      payload['path'],
      payload['url'],
      payload['data'],
      payload['result'],
    ];

    for (const candidate of directCandidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }

      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const nested = candidate as Record<string, unknown>;
      const nestedPath = nested['imagePath'] ?? nested['path'] ?? nested['url'];

      if (typeof nestedPath === 'string' && nestedPath.trim().length > 0) {
        return nestedPath;
      }
    }

    return null;
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

      const message =
        error.error?.errorMessage || error.error?.message || error.error?.title || error.message;

      return typeof message === 'string' && message.trim().length > 0 ? message : fallbackMessage;
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return fallbackMessage;
  }
}
