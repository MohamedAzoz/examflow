import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

export interface IAdmin {
  nationalId: string;
  fullName: string;
  universityCode: string;
  jobTitle: string;
  email: string;
  phoneNumber: string;
}
export interface IAdminSearch {
  nameSearch: string;
  adminSortingOption: number;
  pageIndex: number;
  pageSize: number;
}
@Injectable({
  providedIn: 'root',
})
export class Admin {
  private http = inject(HttpClient);

  // /api/Admin/create
  createAdmin(admin: IAdmin) {
    return this.http.post(`${environment.apiUrl}/Admin/create`, admin);
  }

  // GET : /api/Admin
  getAllAdmins(admin: IAdminSearch) {
    return this.http.get(`${environment.apiUrl}/Admin`, {
      params: {
        nameSearch: admin.nameSearch,
        adminSortingOption: admin.adminSortingOption,
        pageIndex: admin.pageIndex,
        pageSize: admin.pageSize,
      },
    });
  }
// /api/Admin/import-admins
  importAdmins(file: File) {
    const formData = new FormData();
    formData.append('excelFile', file);
    return this.http.post(`${environment.apiUrl}/Admin/import-admins`, formData);
  }

}
