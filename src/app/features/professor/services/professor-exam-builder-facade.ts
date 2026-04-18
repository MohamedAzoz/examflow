import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { QuestionType } from '../../../data/enums/question-type';
import {
  IAssignQuestion,
  IAssignQuestionsToExam,
} from '../../../data/models/ExamQuestions/IAssignQuestionsToExam';
import { IExamQuestions } from '../../../data/models/ExamQuestions/iexam-questions';
import { IcreateExam } from '../../../data/models/ProfessorExam/icreate-exam';
import { IexamDetailsData } from '../../../data/models/ProfessorExam/IexamDetails';
import { IupdateExam } from '../../../data/models/ProfessorExam/IupdateExam';
import { IGetQuestion } from '../../../data/models/question/IGetQuestion';
import { IQuestionRequest } from '../../../data/models/question/iquestion-request';
import { IQuestionResponse } from '../../../data/models/question/iquestion-response';
import { ExamQuestions } from '../../../data/services/exam-questions';
import { ProfessorExam } from '../../../data/services/professor-exam';
import { Question } from '../../../data/services/question';
import { IexamByIddetails } from '../../../data/models/ProfessorExam/Iexamdetails.2';

@Injectable({
  providedIn: 'root',
})
export class ProfessorExamBuilderFacade {
  private readonly professorExamService = inject(ProfessorExam);
  private readonly questionService = inject(Question);
  private readonly examQuestionsService = inject(ExamQuestions);

  private examRequestVersion = 0;
  private assignedQuestionsRequestVersion = 0;
  private questionBankRequestVersion = 0;

  readonly courseId = signal<number | null>(null);
  readonly examId = signal<number | null>(null);
  readonly exam = signal<IexamDetailsData | null>(null);

  readonly questionBank = signal<IQuestionResponse[]>([]);
  readonly selectedQuestionIds = signal<number[]>([]);
  readonly selectedQuestionDegrees = signal<Record<number, number>>({});
  readonly assignedQuestions = signal<IExamQuestions[]>([]);

  readonly questionSearch = signal('');
  readonly questionType = signal<number>(QuestionType.Unknown);
  readonly questionPageIndex = signal(1);
  readonly questionPageSize = signal(12);
  readonly hasMoreQuestions = signal(true);

  readonly isCreateQuestionVisible = signal(false);
  readonly loadingQuestionBank = signal(false);
  readonly loadingAssignedQuestions = signal(false);
  readonly loadingExam = signal(false);
  readonly assigningQuestions = signal(false);
  readonly savingQuestion = signal(false);
  readonly savingExam = signal(false);
  readonly publishingExam = signal(false);

  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly selectedCount = computed(() => this.selectedQuestionIds().length);
  readonly selectedQuestionPreview = computed(() => {
    const selectedSet = new Set(this.selectedQuestionIds());
    return this.questionBank().filter((question) => selectedSet.has(question.id));
  });

  setContext(courseId: number, examId: number): void {
    const isContextChanged = this.courseId() !== courseId || this.examId() !== examId;

    this.courseId.set(courseId);
    this.examId.set(examId);

    if (!isContextChanged) {
      return;
    }

    this.examRequestVersion += 1;
    this.assignedQuestionsRequestVersion += 1;
    this.questionBankRequestVersion += 1;

    this.selectedQuestionIds.set([]);
    this.selectedQuestionDegrees.set({});
    this.assignedQuestions.set([]);
    this.questionBank.set([]);
    this.questionPageIndex.set(1);
    this.hasMoreQuestions.set(true);

    this.loadingExam.set(false);
    this.loadingAssignedQuestions.set(false);
    this.loadingQuestionBank.set(false);
    this.clearMessages();
  }

  seedExamFromCreate(examId: number, payload: Omit<IcreateExam, 'courseId'>): void {
    this.examId.set(examId);

    this.exam.set({
      id: examId,
      title: payload.title,
      passingScore: payload.passingScore,
      startTime: new Date(payload.startTime),
      durationMinutes: payload.durationMinutes,
      totalDegree: payload.totalDegree,
      isRandomQuestions: payload.isRandomQuestions,
      isRandomAnswers: payload.isRandomAnswers,
      examStatus: 'Draft',
      semesterName: '',
      courseName: '',
      academicLevel: 4,
      departmentNames: [],
    });
  }

  seedExamFromExisting(exam: IexamDetailsData): void {
    this.exam.set({
      ...exam,
      startTime: new Date(exam.startTime),
    });
  }

  async loadExamById(): Promise<void> {
    const currentExamId = this.examId();
    if (!currentExamId) {
      return;
    }

    const version = ++this.examRequestVersion;

    this.loadingExam.set(true);
    this.error.set(null);

    try {
      const exam = await this.professorExamService.getExamById(currentExamId);
      if (version !== this.examRequestVersion) {
        return;
      }

      this.exam.set(this.mapExamByIdToUiModel(currentExamId, exam));
    } catch (error) {
      if (version !== this.examRequestVersion) {
        return;
      }

      this.setError(error, 'Failed to load exam settings.');
    } finally {
      if (version === this.examRequestVersion) {
        this.loadingExam.set(false);
      }
    }
  }

  async loadAssignedQuestions(): Promise<void> {
    const currentExamId = this.examId();
    if (!currentExamId) {
      this.assignedQuestions.set([]);
      return;
    }

    const version = ++this.assignedQuestionsRequestVersion;

    this.loadingAssignedQuestions.set(true);
    this.error.set(null);

    try {
      const questions = await firstValueFrom(
        this.examQuestionsService.getExamQuestions(currentExamId),
      );
      if (version !== this.assignedQuestionsRequestVersion) {
        return;
      }

      this.assignedQuestions.set(questions ?? []);
    } catch (error) {
      if (version !== this.assignedQuestionsRequestVersion) {
        return;
      }

      this.setError(error, 'Failed to load assigned questions.');
    } finally {
      if (version === this.assignedQuestionsRequestVersion) {
        this.loadingAssignedQuestions.set(false);
      }
    }
  }

  setCreateQuestionVisible(value: boolean): void {
    this.isCreateQuestionVisible.set(value);
  }

  updateQuestionFilters(search: string, questionType: number): void {
    this.questionSearch.set(search);
    this.questionType.set(questionType);
    this.questionPageIndex.set(1);
    this.hasMoreQuestions.set(true);
    this.questionBank.set([]);
    void this.loadMoreQuestions();
  }

  async loadMoreQuestions(): Promise<void> {
    if (this.loadingQuestionBank() || !this.hasMoreQuestions()) {
      return;
    }

    const currentCourseId = this.courseId();
    if (!currentCourseId) {
      return;
    }

    const version = ++this.questionBankRequestVersion;

    this.loadingQuestionBank.set(true);
    this.error.set(null);

    const query: IGetQuestion = {
      QuestionTextSearch: this.questionSearch().trim(),
      QuestionType: this.questionType(),
      CourseId: currentCourseId,
      PageIndex: this.questionPageIndex(),
      PageSize: this.questionPageSize(),
    };

    try {
      const items = await firstValueFrom(this.questionService.getAllQuestions(query));
      if (version !== this.questionBankRequestVersion) {
        return;
      }

      const incoming = items ?? [];
      this.questionBank.update((current) => this.mergeQuestions(current, incoming));
      this.questionPageIndex.update((index) => index + 1);
      this.hasMoreQuestions.set(incoming.length >= this.questionPageSize());
    } catch (error) {
      if (version !== this.questionBankRequestVersion) {
        return;
      }

      this.setError(error, 'Failed to load course questions.');
    } finally {
      if (version === this.questionBankRequestVersion) {
        this.loadingQuestionBank.set(false);
      }
    }
  }

  toggleQuestionSelection(questionId: number): void {
    let isSelected = false;

    this.selectedQuestionIds.update((selected) => {
      if (selected.includes(questionId)) {
        return selected.filter((id) => id !== questionId);
      }

      isSelected = true;
      return [...selected, questionId];
    });

    if (!isSelected) {
      this.selectedQuestionDegrees.update((current) => {
        if (!(questionId in current)) {
          return current;
        }

        const { [questionId]: _removed, ...rest } = current;
        return rest;
      });

      return;
    }

    this.selectedQuestionDegrees.update((current) => {
      if (questionId in current) {
        return current;
      }

      return {
        ...current,
        [questionId]: this.resolveQuestionDegree(questionId),
      };
    });
  }

  setSelectedQuestionDegree(questionId: number, degree: number): void {
    this.selectedQuestionDegrees.update((current) => ({
      ...current,
      [questionId]: this.normalizeDegree(degree),
    }));
  }

  async assignSelectedQuestions(): Promise<boolean> {
    const currentExamId = this.examId();
    if (!currentExamId) {
      this.error.set('Exam id is required to assign questions.');
      return false;
    }

    const ids = this.selectedQuestionIds();
    if (ids.length === 0) {
      return true;
    }

    const questions: IAssignQuestion[] = ids.map((id) => ({
      id,
      questionDegree: this.resolveQuestionDegree(id),
    }));

    const payload: IAssignQuestionsToExam = {
      examId: currentExamId,
      questions,
    };

    this.assigningQuestions.set(true);
    this.clearMessages();

    try {
      await firstValueFrom(this.examQuestionsService.assignQuestionsToExam(payload));
      this.notice.set('Selected questions were assigned to the exam.');
      this.selectedQuestionIds.set([]);
      this.selectedQuestionDegrees.set({});
      await this.loadAssignedQuestions();
      return true;
    } catch (error) {
      this.setError(error, 'Failed to assign questions.');
      return false;
    } finally {
      this.assigningQuestions.set(false);
    }
  }

  async createQuestion(payload: IQuestionRequest, mediaFile: File | null): Promise<boolean> {
    this.savingQuestion.set(true);
    this.clearMessages();

    try {
      await firstValueFrom(this.questionService.createQuestions(payload));

      if (mediaFile) {
        await firstValueFrom(
          this.questionService.uploadMediaQuestions({
            file: mediaFile,
            courseId: payload.courseId,
          }),
        );
      }

      this.notice.set('Question created successfully.');
      this.isCreateQuestionVisible.set(false);
      this.questionPageIndex.set(1);
      this.hasMoreQuestions.set(true);
      this.questionBank.set([]);
      await this.loadMoreQuestions();
      return true;
    } catch (error) {
      this.setError(error, 'Failed to create question.');
      return false;
    } finally {
      this.savingQuestion.set(false);
    }
  }

  async updateQuestion(payload: IQuestionResponse): Promise<boolean> {
    this.savingQuestion.set(true);
    this.clearMessages();

    try {
      await firstValueFrom(this.questionService.putQuestions(payload));
      this.notice.set('Question updated successfully.');
      await this.loadAssignedQuestions();
      return true;
    } catch (error) {
      this.setError(error, 'Failed to update question.');
      return false;
    } finally {
      this.savingQuestion.set(false);
    }
  }

  async updateExamSettings(payload: IupdateExam): Promise<boolean> {
    this.savingExam.set(true);
    this.clearMessages();

    try {
      await this.professorExamService.updateExam(payload);
      this.notice.set('Exam settings updated successfully.');
      await this.loadExamById();
      return true;
    } catch (error) {
      this.setError(error, 'Failed to update exam settings.');
      return false;
    } finally {
      this.savingExam.set(false);
    }
  }

  async publishExam(): Promise<boolean> {
    const currentExamId = this.examId();
    if (!currentExamId) {
      this.error.set('Exam id is required to publish exam.');
      return false;
    }

    this.publishingExam.set(true);
    this.clearMessages();

    try {
      await this.professorExamService.publishExam(currentExamId);
      this.notice.set('Exam published successfully.');
      this.exam.update((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          examStatus: 'Published',
        };
      });
      return true;
    } catch (error) {
      this.setError(error, 'Failed to publish exam.');
      return false;
    } finally {
      this.publishingExam.set(false);
    }
  }

  clearMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }

  private mapExamByIdToUiModel(examId: number, exam: IexamByIddetails): IexamDetailsData {
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
      semesterName: exam.semesterName,
      courseName: exam.courseName,
      academicLevel: exam.academicLevel,
      departmentNames: (exam.examDepartments ?? []).map((department) => department.departmentName),
    };
  }

  private mergeQuestions(
    current: IQuestionResponse[],
    incoming: IQuestionResponse[],
  ): IQuestionResponse[] {
    const map = new Map<number, IQuestionResponse>();

    for (const item of current) {
      map.set(item.id, item);
    }

    for (const item of incoming) {
      map.set(item.id, item);
    }

    return Array.from(map.values());
  }

  private resolveQuestionDegree(questionId: number): number {
    const selectedDegree = this.selectedQuestionDegrees()[questionId];
    if (Number.isFinite(selectedDegree) && selectedDegree > 0) {
      return this.normalizeDegree(selectedDegree);
    }

    const assignedQuestion = this.assignedQuestions().find((item) => item.id === questionId);
    if (assignedQuestion) {
      return this.normalizeDegree(assignedQuestion.degree);
    }

    const question = this.questionBank().find((item) => item.id === questionId);
    if (question) {
      return this.normalizeDegree(question.degree);
    }

    return 1;
  }

  private normalizeDegree(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 1;
    }

    return Math.floor(parsed);
  }

  private setError(error: unknown, fallbackMessage: string): void {
    this.error.set(this.resolveErrorMessage(error, fallbackMessage));
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendError = error.error as Record<string, unknown> | string | null;

      if (typeof backendError === 'string' && backendError.trim().length > 0) {
        return backendError;
      }

      const message =
        backendError && typeof backendError === 'object'
          ? backendError['errorMessage'] || backendError['message']
          : null;

      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }

      return error.message || fallbackMessage;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return fallbackMessage;
  }
}
