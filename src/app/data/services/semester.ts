import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ISemesterResponse } from '../models/semester/isemester-response';
import { environment } from '../../../environments/environment.development';
import { ISemesterRequest } from '../models/semester/isemester-request';

@Injectable({
  providedIn: 'root',
})
export class Semester {
  private http = inject(HttpClient);

  // GET: /api/Semester/semesters
  getAllSemesters() {
    this.http.get<ISemesterResponse[]>(`${environment.apiUrl}/Semester/semesters`);
  }

  // GET: /api/Semester/active-semester
  getAllActiveSemesters() {
    this.http.get<ISemesterResponse[]>(`${environment.apiUrl}/Semester/active-semester`);
  }
  // POST : /api/Semester/create-semester
  postSemesters(data: ISemesterRequest) {
    this.http.post(`${environment.apiUrl}/Semester/create-semester`, data);
  }
  // PUT: /api/Semester/update-semester
  putSemesters(data: ISemesterResponse) {
    this.http.post(`${environment.apiUrl}/Semester/update-semester`, data);
  }

  // PATCH: /api/Semester/activate
  activateSemesters(id: number) {
    this.http.patch(`${environment.apiUrl}/Semester/activate`, { params: { id } });
  }

  // PATCH: /api/Semester/deactivate
  deactivateSemesters(id: number) {
    this.http.patch(`${environment.apiUrl}/Semester/deactivate`, { params: { id } });
  }

  // DELETE: /api/Semester/delete
  deleteSemesters(id: number) {
    this.http.delete(`${environment.apiUrl}/Semester/delete`, { params: { id } });
  }
}
