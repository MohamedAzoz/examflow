import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Professor {
  private http = inject(HttpClient);

  // POST : /api/Professor/create
  createProfessor(professor: any) {
    return this.http.post(`${environment.apiUrl}/Professor/create`, professor);
  }

  // POST /api/Professor/import-professors
  importProfessors(file: File) {
    const formData = new FormData();
    formData.append('excelFile', file);
    return this.http.post(`${environment.apiUrl}/Professor/import-professors`, formData);
  }

  // GET: /api/Professor
  getAllProfessors(
    NameSearch: string,
    ProfessorSortingOption: number,
    PageSize: number,
    PageIndex: number,
  ) {
    return this.http.get(`${environment.apiUrl}/Professor`, {
      params: {
        nameSearch: NameSearch,
        professorSortingOption: ProfessorSortingOption,
        pageSize: PageSize,
        pageIndex: PageIndex,
      },
    });
  }
}
