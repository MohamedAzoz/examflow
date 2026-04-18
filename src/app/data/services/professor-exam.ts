import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IcreateExam } from '../models/ProfessorExam/icreate-exam';
import { IupdateExam } from '../models/ProfessorExam/IupdateExam';
import { IexamDetails } from '../models/ProfessorExam/IexamDetails';
import { Iexamdetails } from '../models/ProfessorExam/Iexamdetails.1';
import { IexamByIddetails } from '../models/ProfessorExam/Iexamdetails.2';

@Injectable({
  providedIn: 'root',
})
export class ProfessorExam {
  private http = inject(HttpClient);

  async createExam(exam: IcreateExam): Promise<{ id: number }> {
    return firstValueFrom(
      this.http.post<{ id: number }>(`${environment.apiUrl}/ProfessorExam/create`, exam),
    );
  }

  async updateExam(exam: IupdateExam): Promise<unknown> {
    return firstValueFrom(this.http.put(`${environment.apiUrl}/ProfessorExam/update`, exam));
  }

  async deleteExam(examId: number): Promise<unknown> {
    return firstValueFrom(this.http.delete(`${environment.apiUrl}/ProfessorExam/${examId}`));
  }

  async getExamDetails(details: Iexamdetails = {}): Promise<IexamDetails> {
    let params = new HttpParams();

    params = this.appendParam(params, 'courseId', details.courseId);
    params = this.appendParam(params, 'academicLevel', details.academicLevel);
    params = this.appendParam(params, 'departmentId', details.departmentId);
    params = this.appendParam(params, 'sorting', details.sorting);
    params = this.appendParam(params, 'examStatus', details.examStatus);
    params = this.appendParam(params, 'semesterId', details.semesterId);
    params = this.appendParam(params, 'searchTitle', details.searchTitle);
    params = this.appendParam(params, 'pageIndex', details.pageIndex);
    params = this.appendParam(params, 'pageSize', details.pageSize);

    return firstValueFrom(
      this.http.get<IexamDetails>(`${environment.apiUrl}/ProfessorExam/details`, { params }),
    );
  }

  async publishExam(examId: number): Promise<unknown> {
    return firstValueFrom(
      this.http.put(`${environment.apiUrl}/ProfessorExam/${examId}/publish`, {}),
    );
  }

  async getExamById(examId: number): Promise<IexamByIddetails> {
    return firstValueFrom(
      this.http.get<IexamByIddetails>(`${environment.apiUrl}/ProfessorExam/${examId}`),
    );
  }

  private appendParam(
    params: HttpParams,
    key: string,
    value: string | number | null | undefined,
  ): HttpParams {
    if (value === null || value === undefined) {
      return params;
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      return params;
    }

    return params.set(key, String(value));
  }

  //xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  public async getExamResultsReport(examId: number): Promise<unknown> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/ProfessorExam/results-report/${examId}`),
    );
  }

  public async getExamCheatingReport(examId: number): Promise<unknown> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/ProfessorExam/cheating-report/${examId}`),
    );
  }

  public async getStudentsEssaysForGrading(examId: number): Promise<unknown> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/ProfessorExam/students-essays-grading`, {
        params: { examId },
      }),
    );
  }

  public gradeEssays(
    gradingData: { examId: number; studentId: number; questionId: number; grade: number }[],
  ): Promise<unknown> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/ProfessorExam/grade-essays`, gradingData),
    );
  }
}
