import { inject, Injectable, signal } from '@angular/core';
import { Department } from '../../../data/services/department';
import { IDepartment } from '../../../data/models/department/idepartment';
import { IDepartmentById } from '../../../data/models/department/idepartment-by-id';

@Injectable({
  providedIn: 'root',
})
export class DepartmentFacade {
  private department = inject(Department);
  
  public departments = signal<IDepartmentById[]>([]);
  public departmentById = signal<IDepartmentById | null>(null);
  public loading = signal<boolean>(false);
  public error = signal<string | null>(null);
  getDepartments() {
    this.loading.set(true);
    this.department.getDepartments().subscribe({
      next: (res) => {
        this.departments.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  getDepartmentById(id: number) {
    this.loading.set(true);
    this.department.getDepartmentById(id).subscribe({
      next: (res) => {
        this.departmentById.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  postDepartment(department: IDepartment) {
    this.loading.set(true);
    this.department.postDepartment(department).subscribe({
      next: (res) => {
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  putDepartment(department: IDepartmentById) {
    this.loading.set(true);
    this.department.putDepartment(department).subscribe({
      next: (res) => {
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }

  deleteDepartment(id: number) {
    this.loading.set(true);
    this.department.deleteDepartment(id).subscribe({
      next: (res) => {
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }
}
