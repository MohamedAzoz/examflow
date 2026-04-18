import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { IExamQuestions } from '../models/ExamQuestions/iexam-questions';
import { IAssignQuestionsToExam } from '../models/ExamQuestions/IAssignQuestionsToExam';

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
  public assignQuestionsToExam(data:IAssignQuestionsToExam) {
    return this.http.post(`${environment.apiUrl}/ExamQuestions/assign`, data);
  }
  public deleteQuestionFromExam(examId: number, questionId: number) {
    return this.http.delete(
      `${environment.apiUrl}/ExamQuestions/${examId}/questions/${questionId}`,
    );
  }
}
