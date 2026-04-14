import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IQuestionRequest } from '../models/question/iquestion-request';
import { environment } from '../../../environments/environment';
import { IQuestionResponse } from '../models/question/iquestion-response';
import { IQuestionUploadMedia } from '../models/question/iquestion-upload-media';
import { IQuestionImport } from '../models/question/iquestion-import';

@Injectable({
  providedIn: 'root',
})
export class Question {
  private http = inject(HttpClient);

  // GET : /api/Question/get-all
  getAllQuestions(): Observable<IQuestionResponse[]> {
    return this.http.get<IQuestionResponse[]>(`${environment.apiUrl}/Question/get-all`);
  }

  // GET: /api/Question/{id}
  getQuestionById(id: number): Observable<IQuestionResponse> {
    return this.http.get<IQuestionResponse>(`${environment.apiUrl}/Question/${id}`);
  }

  // POST: /api/Question/create
  createQuestions(data: IQuestionRequest): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/Question/create`, data);
  }

  // DELETE: /api/Question
  deleteQuestions(id: number): Observable<unknown> {
    return this.http.delete(`${environment.apiUrl}/Question`, { params: { id } });
  }

  // PUT: /api/Question
  putQuestions(data: IQuestionResponse): Observable<unknown> {
    return this.http.put(`${environment.apiUrl}/Question/create`, data);
  }

  // POST: /api/Question/import-questions
  importQuestions(data: IQuestionImport): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/Question/import-questions`, data);
  }

  //POST: /api/Question/upload-media
  uploadMediaQuestions(data: IQuestionUploadMedia): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/Question/upload-media`, data);
  }
}
