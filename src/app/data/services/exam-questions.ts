import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { IExamQuestions } from '../models/ExamQuestions/iexam-questions';

@Injectable({
  providedIn: 'root',
})
export class ExamQuestions {
  private http = inject(HttpClient);
  /*
GET
/api/ExamQuestions/{examId}
  */
  public getExamQuestions(examId: number) {
    return this.http.get<IExamQuestions[]>(`${environment.apiUrl}/ExamQuestions/${examId}`);
  }
  public assignQuestionsToExam(examId: number, questionIds: number[]) {
    return this.http.post(`${environment.apiUrl}/ExamQuestions/assign`, {
      examId,
      questionIds,
    });
  }
  public deleteQuestionFromExam(examId: number, questionId: number) {
    return this.http.delete(
      `${environment.apiUrl}/ExamQuestions/${examId}/questions/${questionId}`,
    );
  }
}
