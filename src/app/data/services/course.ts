import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ICoueseResponse } from '../models/course/icouese-response';
import { environment } from '../../../environments/environment';
import { ICoueseRequest } from '../models/course/icouese-request';
import { IassignDepartments } from '../models/course/IassignDepartments';
import { ICoueseResponseDetails } from '../models/course/ICoueseResponseDetails';
import { IPaginatedResponse } from '../models/IPaginatedResponse';

@Injectable({
  providedIn: 'root',
})
export class Course {
  private http = inject(HttpClient);

  // GET /api/Course/courses
  /*
AcademicLevel
HasProfessor
boolean
HasDepartment
boolean
PageIndex
PageSize
  */
  getAllCourses(
    AcademicLevel: number | null,
    HasProfessor: boolean | null = null,
    HasDepartment: boolean | null = null,
    PageIndex: number = 1,
    PageSize: number = 10,
  ) {
    let query = '?';
    if (AcademicLevel) {
      query += `AcademicLevel=${AcademicLevel}&`;
    }
    if (HasProfessor) {
      query += `HasProfessor=${HasProfessor}&`;
    }
    if (HasDepartment) {
      query += `HasDepartment=${HasDepartment}&`;
    }
    if (PageIndex) {
      query += `PageIndex=${PageIndex}&`;
    }
    if (PageSize) {
      query += `PageSize=${PageSize}`;
    }
    return this.http.get<IPaginatedResponse<ICoueseResponse>>(`${environment.apiUrl}/Course${query}`);
  }
  // GET /api/Course/course
  getCourse(id: number) {
    return this.http.get<ICoueseResponse>(`${environment.apiUrl}/Course/${id}`);
  }

  // POST /api/Course
  postCourse(data: ICoueseRequest) {
    return this.http.post(`${environment.apiUrl}/Course`, data);
  }

  // PUT /api/Course
  putCourse(data: ICoueseResponse) {
    return this.http.put(`${environment.apiUrl}/Course`, data);
  }
  // DELETE /api/Course
  deleteCourse(id: number) {
    return this.http.delete(`${environment.apiUrl}/Course?id=${id}`);
  }
  // /api/Course/{id}/assign-departments
  assignDepartments(courseId: number) {
    return this.http.get<IassignDepartments[]>(
      `${environment.apiUrl}/Course/${courseId}/assign-departments`,
    );
  }
  // /api/Course/{id}
  getCourseById(id: number) {
    return this.http.get<ICoueseResponse>(`${environment.apiUrl}/Course/${id}`);
  }
  // /api/Course/overview/{id}
  getCourseOverview(id: number) {
    return this.http.get<ICoueseResponseDetails>(`${environment.apiUrl}/Course/overview/${id}`);
  }
  // GET
  // /api/Course/available
  getAvailableCourses(ForProfessors: boolean = false) {
    return this.http.get<ICoueseResponse[]>(
      `${environment.apiUrl}/Course/available?ForProfessors=${ForProfessors}`,
    );
  }
}
