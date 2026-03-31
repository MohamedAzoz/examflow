import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { IsendAnswer } from '../models/StudentExam/isend-answer';
import { IstartExam } from '../models/StudentExam/IstartExam';
import { IavailableExams } from '../models/StudentExam/IavailableExams';

@Injectable({
  providedIn: 'root',
})
export class StudentExam {
  private http = inject(HttpClient);

  getAvailableExams() {
    return this.http.get<IavailableExams[]>(`${environment.apiUrl}/StudentExam/available`);
  }

  startExam(examId: number) {
    return this.http.post<IstartExam>(`${environment.apiUrl}/StudentExam/${examId}/start`, {});
  }

  sendAnswer(answer: IsendAnswer) {
    return this.http.post(`${environment.apiUrl}/StudentExam/send-answer`, answer);
  }

  submitExam(examId: number) {
    return this.http.post(`${environment.apiUrl}/StudentExam/${examId}/submit`, {});
  }
}
