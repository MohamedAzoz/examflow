import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';

export interface IProfessor {
  fullName: string;
  nationalId: string;
  email: string;
  phoneNumber: string;
  academicRank: string;
  universityCode: string;
}

export interface IProfessorResponse {
  data: IProfessor[];
  totalSize: number;
  pageIndex: number;
  pageSize: number;
}

export interface IProfessorSearch {
  nameSearch: string;
  professorSortingOption: number;
  pageIndex: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class Professor {
  private http = inject(HttpClient);

  // POST : /api/Professor/create
  createProfessor(professor: IProfessor) {
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
  ): Observable<IProfessorResponse> {
    return this.http.get<IProfessorResponse>(`${environment.apiUrl}/Professor`, {
      params: {
        nameSearch: NameSearch,
        professorSortingOption: ProfessorSortingOption,
        pageSize: PageSize,
        pageIndex: PageIndex,
      },
    });
  }
}
