import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IcreateExam } from '../models/ProfessorExam/icreate-exam';
import { IupdateExam } from '../models/ProfessorExam/IupdateExam';
import { IexamDetails } from '../models/ProfessorExam/IexamDetails';
import { Iexamdetails } from '../models/ProfessorExam/Iexamdetails.1';
import { IexamByIddetails } from '../models/ProfessorExam/Iexamdetails.2';
import { IEssayGradingDetails } from '../models/ProfessorExam/IEssayGradingDetails';
import { SkipLoading } from '../../core/interceptors/loading-interceptor';

@Injectable({
  providedIn: 'root',
})
export class ProfessorExam {
  private http = inject(HttpClient);

  createExam(exam: IcreateExam) {
    return this.http.post<{ id: number }>(`${environment.apiUrl}/ProfessorExam/create`, exam);
  }

  updateExam(exam: IupdateExam) {
    return this.http.put(`${environment.apiUrl}/ProfessorExam/update`, exam);
  }

  deleteExam(examId: number) {
    return this.http.delete(`${environment.apiUrl}/ProfessorExam/${examId}`);
  }

  getExamDetails(details: Iexamdetails = {}) {
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

    return this.http.get<IexamDetails>(`${environment.apiUrl}/ProfessorExam/details`, { params });
  }

  publishExam(examId: number) {
    return this.http.put(`${environment.apiUrl}/ProfessorExam/${examId}/publish`, {});
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
  // /api/ProfessorExam/{id}
  public getExamById(examId: number) {
    return this.http.get<IexamByIddetails>(`${environment.apiUrl}/ProfessorExam/${examId}`,{
      context: new HttpContext().set(SkipLoading, true)
    });
  }

  //xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  public getExamResultsReport(examId: number) {
    return this.http.get(`${environment.apiUrl}/ProfessorExam/results-report/${examId}`, {
      responseType: 'blob',
    });
  }
  public getExamCheatingReport(examId: number) {
    return this.http.get(`${environment.apiUrl}/ProfessorExam/cheating-report/${examId}`, {
      responseType: 'blob',
    });
  }
  /*
ExamId
PageIndex
Pagesize

*/
  public getStudentsEssaysForGrading(data: IEssayGradingDetails) {
    return this.http.get(`${environment.apiUrl}/ProfessorExam/students-essays-grading`, {
      params: { ExamId: data.ExamId, PageIndex: data.PageIndex, PageSize: data.PageSize },
    });
  }
  public gradeEssays(
    gradingData: { examId: number; studentId: number; questionId: number; grade: number }[],
  ) {
    return this.http.post(`${environment.apiUrl}/ProfessorExam/grade-essays`, gradingData);
  }
}
