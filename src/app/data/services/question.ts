import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { IQuestionRequest } from '../models/question/iquestion-request';
import { environment } from '../../../environments/environment';
import { IQuestionResponse } from '../models/question/iquestion-response';
import { IQuestionUploadMedia } from '../models/question/iquestion-upload-media';
import { IQuestionImport } from '../models/question/iquestion-import';
import { IGetQuestion } from '../models/question/IGetQuestion';
import { SkipLoading } from '../../core/interceptors/loading-interceptor';
import { IQuestionListResponse } from '../models/question/IQuestionListResponse';

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

  getAllQuestions(data: IGetQuestion): Observable<IQuestionListResponse> {
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
      .get<IQuestionListResponse>(`${environment.apiUrl}/Question`, {
        params,
        context: new HttpContext().set(SkipLoading, true),
      })
      .pipe(map((response) => this.extractQuestionItems(response)));
  }

  private extractQuestionItems(response: unknown): IQuestionListResponse {
    const directItems = this.extractArrayCandidate(response);
    if (directItems) {
      return this.createPagedResponse(directItems);
    }

    if (!response || typeof response !== 'object') {
      return this.createPagedResponse([]);
    }

    const root = response as Record<string, unknown>;
    const candidates: Record<string, unknown>[] = [root];

    for (const key of ['data', 'items', 'questions', 'result']) {
      const candidate = root[key];
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        candidates.push(candidate as Record<string, unknown>);
      }
    }

    for (const candidate of candidates) {
      for (const key of ['data', 'items', 'questions', 'result']) {
        const list = this.extractArrayCandidate(candidate[key]);
        if (!list) {
          continue;
        }

        return this.createPagedResponse(
          list,
          this.readNumber(candidate, 'pageSize', 'PageSize') ??
            this.readNumber(root, 'pageSize', 'PageSize') ??
            list.length,
          this.readNumber(candidate, 'pageIndex', 'PageIndex') ??
            this.readNumber(root, 'pageIndex', 'PageIndex') ??
            (list.length > 0 ? 1 : 0),
          this.readNumber(candidate, 'totalSize', 'TotalSize') ??
            this.readNumber(root, 'totalSize', 'TotalSize') ??
            list.length,
        );
      }
    }

    return this.createPagedResponse([]);
  }

  private createPagedResponse(
    data: IQuestionResponse[],
    pageSize?: number,
    pageIndex?: number,
    totalSize?: number,
  ): IQuestionListResponse {
    return {
      pageSize: this.toNonNegativeInt(pageSize, data.length),
      pageIndex: this.toNonNegativeInt(pageIndex, data.length > 0 ? 1 : 0),
      totalSize: this.toNonNegativeInt(totalSize, data.length),
      data,
    };
  }

  private readNumber(
    source: Record<string, unknown>,
    lowerCaseKey: string,
    pascalCaseKey: string,
  ): number | undefined {
    const value = source[lowerCaseKey] ?? source[pascalCaseKey];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return undefined;
    }

    return value;
  }

  private toNonNegativeInt(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return fallback;
    }

    return Math.floor(value);
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
    return this.http.get<IQuestionResponse>(`${environment.apiUrl}/Question/${id}`, {
      context: new HttpContext().set(SkipLoading, true),
    });
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

    return this.http.post<{
      imagePath: 'string';
    }>(`${environment.apiUrl}/Question/upload-media`, formData);
  }
}
