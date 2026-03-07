import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SkipLoading } from '../../core/interceptors/loading-interceptor';

export interface IStudentSearch {
  nameSearch: string;
  departmentId: number;
  academicLevel: number;
  studentSortingOption: number;
  pageSize: number;
  pageIndex: number;
}
export interface IStudentResponse {
  pageSize: number;
  pageIndex: number;
  totalSize: number;
  data: [
    {
      id: string;
      nationalId: string;
      fullName: string;
      universityCode: string;
      academicLevel: number;
      departmentCode: string;
      email: string;
      phoneNumber: string;
    },
  ];
}
export interface IStudentRequest {
  nationalId: string;
  fullName: string;
  universityCode: string;
  academicLevel: number;
  departmentId: number;
  email: string;
  phoneNumber: string;
}

@Injectable({
  providedIn: 'root',
})
export class Student {
  private http = inject(HttpClient);

  // POST : /api/Student/create
  createStudent(student: IStudentRequest) {
    return this.http.post(`${environment.apiUrl}/Student/create`, student);
  }

  // POST /api/Student/import-students
  importStudents(file: File) {
    const formData = new FormData();
    formData.append('excelFile', file);
    return this.http.post(`${environment.apiUrl}/Student/import-students`, formData);
  }

  // GET: /api/Student
  getAllStudents(student: IStudentSearch) {
    // filtration on the query if the value is 0 or null or empty string
    var search: any = {
      nameSearch: student.nameSearch,
      departmentId: student.departmentId,
      academicLevel: student.academicLevel,
      studentSortingOption: student.studentSortingOption,
      pageSize: student.pageSize,
      pageIndex: student.pageIndex,
    };
    if (student.departmentId === 0) {
      delete search.departmentId;
    }
    if (student.academicLevel === 0) {
      delete search.academicLevel;
    }
    if (student.studentSortingOption === 0) {
      delete search.studentSortingOption;
    }
    if (student.nameSearch === '') {
      delete search.nameSearch;
    }

    return this.http.get<IStudentResponse>(`${environment.apiUrl}/Student`, {
      params: search,
      context: new HttpContext().set(SkipLoading, true)
    });
  }
}
