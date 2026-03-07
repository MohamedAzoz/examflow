import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ICoueseResponse } from '../models/course/icouese-response';
import { environment } from '../../../environments/environment.development';
import { ICoueseRequest } from '../models/course/icouese-request';

@Injectable({
  providedIn: 'root',
})
export class Course {
  private http = inject(HttpClient);

  // GET /api/Course/courses
  getAllCourses() {
    this.http.get<ICoueseResponse[]>(`${environment.apiUrl}/Course/courses`);
  }
  // GET /api/Course/course
  getCourse(id: number) {
    this.http.get<ICoueseResponse>(`${environment.apiUrl}/Course/course?id=${id}`);
  }

  // POST /api/Course
  postCourse(data: ICoueseRequest) {
    this.http.post(`${environment.apiUrl}/Course`, data);
  }

  // PUT /api/Course
  putCourse(data: ICoueseResponse) {
    this.http.put(`${environment.apiUrl}/Course`, data);
  }
  // DELETE /api/Course
  deleteCourse(id: number) {
    this.http.delete(`${environment.apiUrl}/Course?id=${id}`);
  }
}
