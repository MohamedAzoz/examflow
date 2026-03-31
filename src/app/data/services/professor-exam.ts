import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { IcreateExam } from '../models/ProfessorExam/icreate-exam';
import { IupdateExam } from '../models/ProfessorExam/IupdateExam';
import { IexamDetails } from '../models/ProfessorExam/IexamDetails';
import { ExamSortingOptions } from '../enums/ExamSortingOptions';
import { ProfessorExamStatus } from '../enums/ProfessorExamStatus';

@Injectable({
  providedIn: 'root',
})
export class ProfessorExam {
  /*
  POST
/api/ProfessorExam/create

POST
/api/ProfessorExam/update

DELETE
/api/ProfessorExam

GET
/api/ProfessorExam/details

PUT
/api/ProfessorExam/{id}/publish */
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
  /*
Name	Description
CourseId
AcademicLevel
DepartmentId
Sorting
Available values : ExamSortingOptions
ExamStatus
SemesterId
SearchTitle
PageIndex
Pagesize
*/

  getExamDetails(
    courseId: number,
    academicLevel: number,
    departmentId: number,
    sorting: ExamSortingOptions,
    examStatus: ProfessorExamStatus,
    semesterId: number,
    searchTitle: string,
    pageIndex: number,
    pageSize: number,
  ) {
    var url = `${environment.apiUrl}/ProfessorExam/details?courseId=${courseId}
    &academicLevel=${academicLevel}
    &departmentId=${departmentId}
    &sorting=${sorting}
    &examStatus=${examStatus}
    &semesterId=${semesterId}
    &searchTitle=${searchTitle}
    &pageIndex=${pageIndex}
    &pageSize=${pageSize}`;
    return this.http.get<IexamDetails>(url);
  }

  publishExam(examId: number) {
    return this.http.put(`${environment.apiUrl}/ProfessorExam/${examId}/publish`, {});
  }
}
