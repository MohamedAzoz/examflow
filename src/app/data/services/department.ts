import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

export interface IDepartment {
  name: string;
  code: string;
}

export interface IDepartmentById {
  id: number;
  name: string;
  code: string;
}

@Injectable({
  providedIn: 'root',
})
export class Department {
  private http = inject(HttpClient);

  // Get : /api/Department/departments
  getDepartments() {
    return this.http.get<IDepartmentById[]>(`${environment.apiUrl}/Department/departments`);
  }
  // Get : /api/Department/department this grt id by query
  getDepartmentById(id: number) {
    return this.http.get<IDepartmentById>(
      `${environment.apiUrl}/Department/department?id=${id}`,
    );
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
}
