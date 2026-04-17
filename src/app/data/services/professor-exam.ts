import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { IcreateExam } from '../models/ProfessorExam/icreate-exam';
import { IupdateExam } from '../models/ProfessorExam/IupdateExam';
import { IexamDetails } from '../models/ProfessorExam/IexamDetails';
import { Iexamdetails } from '../models/ProfessorExam/Iexamdetails.1';

@Injectable({
  providedIn: 'root',
})
export class ProfessorExam {
  private http = inject(HttpClient);

  createExam(exam: IcreateExam) {
    return this.http.post(`${environment.apiUrl}/ProfessorExam/create`, exam);
  }

  updateExam(exam: IupdateExam) {
    return this.http.post(`${environment.apiUrl}/ProfessorExam/update`, exam);
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
}
