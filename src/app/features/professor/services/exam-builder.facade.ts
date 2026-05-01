import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { QuestionType } from '../../../data/enums/question-type';
import {
  IAssignQuestion,
  IAssignQuestionsToExam,
} from '../../../data/models/ExamQuestions/IAssignQuestionsToExam';
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
import { getExamStatusTitle } from '../../../shared/utils/exam-status-title.util';
import { IError } from '../../../data/models/IErrorResponse';

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
  courseId: number;
  imagePath: string;
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
  readonly selectedQuestionIds = signal<number[]>([]);
  readonly persistedAssignedQuestionIds = signal<number[]>([]);
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
    const normalizedCourseId = courseId && courseId > 0 ? courseId : null;
    const normalizedExamId = examId && examId > 0 ? examId : null;

    const contextChanged =
      this.currentCourseId() !== normalizedCourseId || this.currentExamId() !== normalizedExamId;

    this.currentCourseId.set(normalizedCourseId);
    this.currentExamId.set(normalizedExamId);

    if (!contextChanged) {
      return;
    }

    this.currentExam.set(null);
    this.assignedQuestions.set([]);
    this.selectedQuestionIds.set([]);
    this.persistedAssignedQuestionIds.set([]);
    this.resetQuestionBank();
    this.error.set(null);
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
    const normalizedQuestions = questions ?? [];
    this.assignedQuestions.set(normalizedQuestions);

    const idsInMiddle = new Set(normalizedQuestions.map((question) => question.id));
    this.selectedQuestionIds.update((ids) => ids.filter((id) => idsInMiddle.has(id)));
  }

  isSelectedQuestion(questionId: number): boolean {
    return this.selectedQuestionIds().includes(questionId);
  }

  isPersistedQuestion(questionId: number): boolean {
    return this.persistedAssignedQuestionIds().includes(questionId);
  }

  selectQuestionFromBank(question: IQuestionResponse): void {
    if (!Number.isFinite(question.id) || question.id <= 0) {
      return;
    }

    this.selectedQuestionIds.update((ids) =>
      ids.includes(question.id) ? ids : [...ids, question.id],
    );

    this.assignedQuestions.update((questions) => {
      if (questions.some((item) => item.id === question.id)) {
        return questions;
      }

      return [...questions, this.mapQuestionBankItemToAssigned(question)];
    });
  }

  deselectQuestionFromBank(questionId: number): void {
    if (this.isPersistedQuestion(questionId)) {
      return;
    }

    this.selectedQuestionIds.update((ids) => ids.filter((id) => id !== questionId));

    this.assignedQuestions.update((questions) =>
      questions.filter((question) => question.id !== questionId),
    );
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

        const assignedIds = workspace.assignedQuestions.map((question) => question.id);
        this.persistedAssignedQuestionIds.set(assignedIds);
        this.selectedQuestionIds.set(assignedIds);
      }),
      catchError((error) => this.handleError(error)),
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
      catchError((error) => this.handleError(error)),
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
      catchError((error) => this.handleError(error)),
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
      catchError((error) => this.handleError(error)),
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

        const items = Array.isArray(response.data) ? response.data : [];
        const effectivePageIndex = this.normalizePageIndex(response.pageIndex);
        const effectivePageSize = this.normalizePageSize(response.pageSize);
        const totalSize = response.totalSize ?? 0;
        const current = this.questionBank();
        const mergedItems =
          safePageIndex === 1 ? items : this.mergeQuestionsById(current.items, items);

        this.questionBank.set({
          items: mergedItems,
          pageIndex: safePageIndex,
          pageSize: safePageSize,
          search: normalizedSearch,
          type,
          hasMore: effectivePageIndex * effectivePageSize < totalSize,
          totalLoaded: mergedItems.length,
        });
      }),
      map((response) => (Array.isArray(response.data) ? response.data : [])),
      catchError((error) => this.handleError(error)),
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
      tap((questions) => {
        const normalizedQuestions = questions ?? [];
        const assignedIds = normalizedQuestions.map((question) => question.id);

        this.assignedQuestions.set(normalizedQuestions);
        this.persistedAssignedQuestionIds.set(assignedIds);
        this.selectedQuestionIds.set(assignedIds);
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this.loadingAssignedQuestions.set(false)),
    );
  }

  assignQuestionsToExam(payload: IAssignQuestionsToExam): Observable<IExamQuestions[]> {
    const examId = payload.examId;
    if (!Number.isFinite(examId) || examId <= 0) {
      const message = 'Exam id is required before assigning questions to exam.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    const normalizedQuestions = this.normalizeAssignQuestions(payload.questions ?? []);
    const questionsToAssign = normalizedQuestions.filter(
      (question) => !this.persistedAssignedQuestionIds().includes(question.id),
    );

    if (questionsToAssign.length === 0) {
      return of(this.assignedQuestions());
    }

    this.mutatingQuestions.set(true);
    this.error.set(null);

    return this.examQuestionsService
      .assignQuestionsToExam({ examId, questions: questionsToAssign })
      .pipe(
        switchMap(() => this.loadAssignedQuestions(examId)),
        catchError((error) => this.handleError(error)),
        finalize(() => this.mutatingQuestions.set(false)),
      );
  }

  removeAssignedQuestion(
    questionId: number,
    examId: number = this.currentExamId()!,
  ): Observable<IExamQuestions[]> {
    if (!Number.isFinite(questionId) || questionId <= 0) {
      return of(this.assignedQuestions());
    }

    const persisted = this.isPersistedQuestion(questionId);
    this.selectedQuestionIds.update((ids) => ids.filter((id) => id !== questionId));

    if (!persisted) {
      this.assignedQuestions.update((questions) =>
        questions.filter((question) => question.id !== questionId),
      );
      return of(this.assignedQuestions());
    }

    if (!examId || examId <= 0) {
      const message = 'Exam id is required before removing assigned question.';
      this.error.set(message);
      return throwError(() => new Error(message));
    }

    this.mutatingQuestions.set(true);
    this.error.set(null);

    return this.examQuestionsService.deleteQuestionFromExam(examId, questionId).pipe(
      switchMap(() => this.loadAssignedQuestions(examId)),
      catchError((error: HttpErrorResponse) => this.handleError(error)),
      finalize(() => this.mutatingQuestions.set(false)),
    );
  }

  createQuestion(questionData: ExamBuilderCreateQuestionData): Observable<unknown> {
    this.mutatingQuestions.set(true);
    this.error.set(null);

    return this.questionService.createQuestions(questionData).pipe(
      catchError((error) => this.handleError(error)),
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
      imagePath: questionData.imagePath ?? '',
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
      catchError((error: HttpErrorResponse) => this.handleError(error)),
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
      catchError((error: HttpErrorResponse) => this.handleError(error)),
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
      examStatus: getExamStatusTitle(exam.examStatus),
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

  private normalizeAssignQuestions(questions: IAssignQuestion[]): IAssignQuestion[] {
    const unique = new Map<number, IAssignQuestion>();

    for (const question of questions) {
      const id = Number(question.id);
      if (!Number.isFinite(id) || id <= 0) {
        continue;
      }

      const degree = this.normalizeDegree(Number(question.questionDegree));
      unique.set(id, { id, questionDegree: degree });
    }

    return Array.from(unique.values());
  }

  private mapQuestionBankItemToAssigned(question: IQuestionResponse): IExamQuestions {
    const resolvedCourseId = this.resolveCourseId(question.courseId);

    return {
      id: question.id,
      text: question.text,
      imagePath: '',
      questionType: question.questionType,
      degree: this.normalizeDegree(question.degree),
      courseId: resolvedCourseId ?? 0,
      options: question.options ?? [],
      correctOptionText: question.correctOptionText ?? '',
    };
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

  private handleError(error: HttpErrorResponse): Observable<never> {
    const errorResponse: IError = {
      statusCode: error.status,
      errorMessage: error.error?.errorMessage || 'حدث خطأ غير متوقع',
      errors: error.error?.errors || [],
    };
    return throwError(() => errorResponse);
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
