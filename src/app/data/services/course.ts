import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ICoueseResponse } from '../models/course/icouese-response';
import { environment } from '../../../environments/environment.development';
import { ICoueseRequest } from '../models/course/icouese-request';
import { IassignDepartments } from '../models/course/IassignDepartments';

@Injectable({
  providedIn: 'root',
})
export class Course {
  private http = inject(HttpClient);

  // GET /api/Course/courses
  getAllCourses() {
    return this.http.get<ICoueseResponse[]>(`${environment.apiUrl}/Course`);
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
    return this.http.get<IassignDepartments[]>(`${environment.apiUrl}/Course/${courseId}/assign-departments`);
  }
}
