import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IcreateExam } from '../../../data/models/ProfessorExam/icreate-exam';
import { Iexamdetails } from '../../../data/models/ProfessorExam/Iexamdetails.1';
import { IexamDetailsData } from '../../../data/models/ProfessorExam/IexamDetails';
import { IupdateExam } from '../../../data/models/ProfessorExam/IupdateExam';
import { ProfessorExam } from '../../../data/services/professor-exam';
import { Course } from '../../../data/services/course';
import { IassignDepartments } from '../../../data/models/course/IassignDepartments';

@Injectable({
  providedIn: 'root',
})
export class ProfessorExamFacade {
  private readonly professorExamService = inject(ProfessorExam);
  private readonly courseService = inject(Course);

  private examsRequestVersion = 0;
  private departmentsRequestVersion = 0;

  public readonly examsRequest = signal<Iexamdetails>({
    courseId: null,
    academicLevel: null,
    departmentId: null,
    sorting: null,
    examStatus: null,
    semesterId: null,
    searchTitle: null,
    pageSize: 5,
    pageIndex: 1,
  });

  public readonly courseId = signal<number | null>(null);
  public readonly loadingExams = signal<boolean>(false);
  public readonly loadingDepartments = signal<boolean>(false);
  public readonly creatingExam = signal<boolean>(false);
  public readonly updatingExam = signal<boolean>(false);
  public readonly deletingExam = signal<boolean>(false);
  public readonly publishingExam = signal<boolean>(false);

  public readonly loading = computed(
    () =>
      this.loadingExams() ||
      this.loadingDepartments() ||
      this.creatingExam() ||
      this.updatingExam() ||
      this.deletingExam() ||
      this.publishingExam(),
  );

  public readonly error = signal<string | null>(null);
  public readonly notice = signal<string | null>(null);
  public readonly exams = signal<IexamDetailsData[]>([]);
  public readonly departments = signal<IassignDepartments[]>([]);
  public readonly totalSize = signal<number>(0);

  setCourseId(courseId: number | null): void {
    this.courseId.set(courseId);
    this.examsRequest.update((current) => ({
      ...current,
      courseId,
    }));

    void this.reloadDepartments();
    void this.reloadExams();
  }

  setPagination(pageIndex: number, pageSize: number): void {
    this.examsRequest.update((current) => ({
      ...current,
      pageIndex,
      pageSize,
    }));

    void this.reloadExams();
  }

  applyFilters(filters: Partial<Iexamdetails>): void {
    this.examsRequest.update((current) => ({
      ...current,
      ...filters,
      pageIndex: 1,
    }));

    void this.reloadExams();
  }

  resetFilters(): void {
    this.examsRequest.update((current) => ({
      ...current,
      academicLevel: null,
      departmentId: null,
      sorting: null,
      examStatus: null,
      semesterId: null,
      searchTitle: null,
      pageIndex: 1,
    }));

    void this.reloadExams();
  }

  async reloadExams(): Promise<void> {
    const request = this.examsRequest();
    const version = ++this.examsRequestVersion;
    const requestCourseId = request.courseId ?? null;

    if (requestCourseId === null || requestCourseId <= 0) {
      this.exams.set([]);
      this.totalSize.set(0);
      return;
    }

    this.loadingExams.set(true);
    this.error.set(null);

    try {
      const result = await this.professorExamService.getExamDetails(request);
      if (version !== this.examsRequestVersion) {
        return;
      }

      this.exams.set(result?.data ?? []);
      this.totalSize.set(result?.totalSize ?? 0);
    } catch (err) {
      if (version !== this.examsRequestVersion) {
        return;
      }

      this.exams.set([]);
      this.totalSize.set(0);
      this.setErrorFromUnknown(err);
    } finally {
      if (version === this.examsRequestVersion) {
        this.loadingExams.set(false);
      }
    }
  }

  async reloadDepartments(): Promise<void> {
    const currentCourseId = this.courseId();
    const version = ++this.departmentsRequestVersion;

    if (currentCourseId === null || currentCourseId <= 0) {
      this.departments.set([]);
      return;
    }

    this.loadingDepartments.set(true);
    this.error.set(null);

    try {
      const departments = await firstValueFrom(
        this.courseService.assignDepartments(currentCourseId),
      );
      if (version !== this.departmentsRequestVersion) {
        return;
      }

      this.departments.set(departments ?? []);
    } catch (err) {
      if (version !== this.departmentsRequestVersion) {
        return;
      }

      this.departments.set([]);
      this.setErrorFromUnknown(err);
    } finally {
      if (version === this.departmentsRequestVersion) {
        this.loadingDepartments.set(false);
      }
    }
  }

  async reloadAll(): Promise<void> {
    await Promise.all([this.reloadDepartments(), this.reloadExams()]);
  }

  async createExam(payload: Omit<IcreateExam, 'courseId'>): Promise<{ id: number } | null> {
    const currentCourseId = this.courseId();
    if (currentCourseId === null || currentCourseId <= 0) {
      const message = 'Course id is required to create an exam.';
      this.error.set(message);
      return null;
    }

    const normalizedStartTime = this.toUtcIsoString(payload.startTime);

    this.creatingExam.set(true);
    this.error.set(null);

    try {
      const response = await this.professorExamService.createExam({
        ...payload,
        startTime: normalizedStartTime,
        courseId: currentCourseId,
      });

      this.notice.set('Exam created successfully.');
      await this.reloadExams();
      return response;
    } catch (err) {
      this.setErrorFromUnknown(err);
      return null;
    } finally {
      this.creatingExam.set(false);
    }
  }

  async updateExam(payload: IupdateExam): Promise<boolean> {
    this.updatingExam.set(true);
    this.error.set(null);

    try {
      await this.professorExamService.updateExam(payload);
      this.notice.set('Exam updated successfully.');
      await this.reloadExams();
      return true;
    } catch (err) {
      this.setErrorFromUnknown(err);
      return false;
    } finally {
      this.updatingExam.set(false);
    }
  }

  async deleteExam(examId: number): Promise<boolean> {
    this.deletingExam.set(true);
    this.error.set(null);

    try {
      await this.professorExamService.deleteExam(examId);
      this.notice.set('Exam deleted successfully.');
      await this.reloadExams();
      return true;
    } catch (err) {
      this.setErrorFromUnknown(err);
      return false;
    } finally {
      this.deletingExam.set(false);
    }
  }

  async publishExam(examId: number): Promise<boolean> {
    this.publishingExam.set(true);
    this.error.set(null);

    try {
      await this.professorExamService.publishExam(examId);
      this.notice.set('Exam published successfully.');
      await this.reloadExams();
      return true;
    } catch (err) {
      this.setErrorFromUnknown(err);
      return false;
    } finally {
      this.publishingExam.set(false);
    }
  }

  clearMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }

  private toUtcIsoString(dateLike: string): string {
    const parsed = new Date(dateLike);

    if (Number.isNaN(parsed.getTime())) {
      return dateLike;
    }

    return parsed.toISOString();
  }

  private setErrorFromUnknown(err: unknown): void {
    const fallbackMessage = 'An unexpected error occurred. Please try again.';

    if (err instanceof HttpErrorResponse) {
      const apiMessage =
        typeof err.error === 'string'
          ? err.error
          : err.error?.message || err.error?.title || err.message;
      this.error.set(apiMessage || fallbackMessage);
      return;
    }

    this.error.set(err instanceof Error ? err.message : fallbackMessage);
  }
}
