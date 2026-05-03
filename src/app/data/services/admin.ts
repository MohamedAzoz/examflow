import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { SkipLoading } from '../../core/interceptors/loading-interceptor';
import { IAdmin } from '../models/admin/IAdmin';
import { IAdminResponse } from '../models/admin/IAdminResponse';
import { IAdminSearch } from '../models/admin/IAdminSearch';
import { IUserSearch } from '../models/admin/IUserSearch';
import { IUserFoundResponse } from '../models/admin/IUserFoundResponse';
import { IUserResetPassword } from '../models/admin/IUserResetPassword';

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
  getAllAdmins(admin: IAdminSearch): Observable<IAdminResponse> {
    return this.http.get<IAdminResponse>(`${environment.apiUrl}/Admin`, {
      params: {
        nameSearch: admin.nameSearch,
        adminSortingOption: admin.adminSortingOption,
        pageIndex: admin.pageIndex,
        pageSize: admin.pageSize,
      },
      context: new HttpContext().set(SkipLoading, true),
    });
  }
  // /api/Admin/import-admins
  importAdmins(file: File) {
    const formData = new FormData();
    formData.append('excelFile', file);
    return this.http.post(`${environment.apiUrl}/Admin/import-admins`, formData);
  }
  // POST
  // /api/Admin/user-reset-password
  resetPassword(data: IUserResetPassword) {
    return this.http.post(`${environment.apiUrl}/Admin/user-reset-password`, data);
  }

  // /api/Admin/user-search
  userSearch(userSearch: IUserSearch) {
    return this.http.post<IUserFoundResponse[]>(
      `${environment.apiUrl}/Admin/user-search`,
      userSearch,
      {
        context: new HttpContext().set(SkipLoading, true),
      },
    );
  }
}
