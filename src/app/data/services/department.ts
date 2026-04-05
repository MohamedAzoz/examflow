import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { SkipLoading } from '../../core/interceptors/loading-interceptor';
import { IAssignCourses } from '../models/department/iassign-courses';
import { IReqAssignCourses } from '../models/department/ireq-assign-courses';
import { IDepartmentById } from '../models/department/idepartment-by-id';
import { IDepartment } from '../models/department/idepartment';

@Injectable({
  providedIn: 'root',
})
export class Department {
  private http = inject(HttpClient);

  // Get : /api/Department/departments
  getDepartments() {
    return this.http.get<IDepartmentById[]>(`${environment.apiUrl}/Department`, {
      context: new HttpContext().set(SkipLoading, true),
    });
  }
  // Get : /api/Department/department this grt id by query
  getDepartmentById(id: number) {
    return this.http.get<IDepartmentById>(`${environment.apiUrl}/Department/${id}`);
  }

  // Post : /api/Department
  postDepartment(department: IDepartment) {
    return this.http.post(`${environment.apiUrl}/Department`, department);
  }

  // Put : /api/Department this update department
  putDepartment(department: IDepartmentById) {
    return this.http.put(`${environment.apiUrl}/Department`, department);
  }

  // Delete : /api/Department this delete department
  deleteDepartment(id: number) {
    return this.http.delete(`${environment.apiUrl}/Department?id=${id}`);
  }

  //PUT :/api/Department/assign-courses
  assignCourses(data: IReqAssignCourses) {
    return this.http.put(`${environment.apiUrl}/Department/assign-courses`, data);
  }
  //GET :/api/Department/assign-courses
  getAssignCourses(id: number) {
    return this.http.get<IAssignCourses>(`${environment.apiUrl}/Department/assigned-courses/${id}`);
  }
}
