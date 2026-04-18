import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IQuestionRequest } from '../models/question/iquestion-request';
import { environment } from '../../../environments/environment';
import { IQuestionResponse } from '../models/question/iquestion-response';
import { IQuestionUploadMedia } from '../models/question/iquestion-upload-media';
import { IQuestionImport } from '../models/question/iquestion-import';
import { IGetQuestion } from '../models/question/IGetQuestion';

@Injectable({
  providedIn: 'root',
})
export class Question {
  private http = inject(HttpClient);

  // GET : /api/Question/get-all
  /*
  Name	Description
QuestionTextSearch
QuestionType
CourseId
PageIndex
PageSize
  */

  getAllQuestions(data: IGetQuestion): Observable<IQuestionResponse[]> {
    let params = new HttpParams();
    params = this.appendParam(params, 'QuestionTextSearch', data.QuestionTextSearch);
    if (data.QuestionType !== 0) {
      params = this.appendParam(params, 'QuestionType', data.QuestionType);
    }
    if (typeof data.CourseId === 'number' && data.CourseId > 0) {
      params = this.appendParam(params, 'CourseId', data.CourseId);
    }
    params = this.appendParam(params, 'PageIndex', data.PageIndex);
    params = this.appendParam(params, 'PageSize', data.PageSize);

    return this.http
      .get<unknown>(`${environment.apiUrl}/Question`, {
        params,
      })
      .pipe(map((response) => this.extractQuestionItems(response)));
  }

  private extractQuestionItems(response: unknown): IQuestionResponse[] {
    const directItems = this.extractArrayCandidate(response);
    if (directItems) {
      return directItems;
    }

    if (!response || typeof response !== 'object') {
      return [];
    }

    const payload = response as Record<string, unknown>;

    const firstLevelCandidates = [
      payload['data'],
      payload['items'],
      payload['questions'],
      payload['result'],
    ];

    for (const candidate of firstLevelCandidates) {
      const list = this.extractArrayCandidate(candidate);
      if (list) {
        return list;
      }

      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const nested = candidate as Record<string, unknown>;
      const nestedCandidates = [
        nested['data'],
        nested['items'],
        nested['questions'],
        nested['result'],
      ];

      for (const nestedCandidate of nestedCandidates) {
        const nestedList = this.extractArrayCandidate(nestedCandidate);
        if (nestedList) {
          return nestedList;
        }
      }
    }

    return [];
  }

  private extractArrayCandidate(value: unknown): IQuestionResponse[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    return value as IQuestionResponse[];
  }

  private appendParam(
    params: HttpParams,
    key: string,
    value: string | number | null | undefined,
  ): HttpParams {
    if (value === null || value === undefined) {
      return params;
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      return params;
    }

    return params.set(key, String(value));
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
    return this.http.put(`${environment.apiUrl}/Question`, data);
  }

  // POST: /api/Question/import-questions
  importQuestions(data: IQuestionImport): Observable<unknown> {
    const formData = new FormData();
    formData.append('excelFile', data.excelFile);
    formData.append('courseId', String(data.courseId));

    return this.http.post(`${environment.apiUrl}/Question/import-questions`, formData);
  }

  //POST: /api/Question/upload-media
  uploadMediaQuestions(data: IQuestionUploadMedia): Observable<unknown> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('courseId', String(data.courseId));

    return this.http.post(`${environment.apiUrl}/Question/upload-media`, formData);
  }
}
