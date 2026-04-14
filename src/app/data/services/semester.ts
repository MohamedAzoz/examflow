import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ISemesterResponse } from '../models/semester/isemester-response';
import { environment } from '../../../environments/environment';
import { ISemesterRequest } from '../models/semester/isemester-request';

@Injectable({
  providedIn: 'root',
})
export class Semester {
  private http = inject(HttpClient);

  // GET: /api/Semester/semesters
  getAllSemesters() {
    return this.http.get<ISemesterResponse[]>(`${environment.apiUrl}/Semester`);
  }

  // GET: /api/Semester/active-semester
  getActiveSemester() {
    return this.http.get<ISemesterResponse>(`${environment.apiUrl}/Semester/active`);
  }
  // POST : /api/Semester/create-semester
  postSemesters(data: ISemesterRequest) {
    return this.http.post(`${environment.apiUrl}/Semester`, data);
  }
  // PUT: /api/Semester/update-semester
  putSemesters(data: ISemesterResponse) {
    return this.http.put(`${environment.apiUrl}/Semester/update`, data);
  }

  // PATCH: /api/Semester/activate
  activateSemesters(id: number) {
    return this.http.patch(`${environment.apiUrl}/Semester/activate`, { params: { id } });
  }

  // PATCH: /api/Semester/deactivate
  deactivateSemesters(id: number) {
    return this.http.patch(`${environment.apiUrl}/Semester/deactivate`, { params: { id } });
  }

  // DELETE: /api/Semester/delete
  deleteSemesters(id: number) {
    return this.http.delete(`${environment.apiUrl}/Semester`, { params: { id } });
  }
}
