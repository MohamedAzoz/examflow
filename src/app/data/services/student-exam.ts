import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { IsendAnswer } from '../models/StudentExam/isend-answer';
import { IstartExam } from '../models/StudentExam/IstartExam';
import { IavailableExams } from '../models/StudentExam/IavailableExams';
import { SkipLoading } from '../../core/interceptors/loading-interceptor';
import { IpastExams } from '../models/StudentExam/IpastExams';

@Injectable({
  providedIn: 'root',
})
export class StudentExam {
  private http = inject(HttpClient);

  getAvailableExams() {
    return this.http.get<IavailableExams[]>(`${environment.apiUrl}/StudentExam/available`, {
      context: new HttpContext().set(SkipLoading, true),
    });
  }

  startExam(examId: number) {
    return this.http.post<IstartExam>(
      `${environment.apiUrl}/StudentExam/${examId}/start`,
      {},
      { context: new HttpContext().set(SkipLoading, true) },
    );
  }

  sendAnswer(answer: IsendAnswer) {
    return this.http.post(`${environment.apiUrl}/StudentExam/send-answer`, answer, {
      context: new HttpContext().set(SkipLoading, true),
    });
  }

  submitExam(examId: number) {
    return this.http.post(
      `${environment.apiUrl}/StudentExam/${examId}/submit`,
      {},
      {
        context: new HttpContext().set(SkipLoading, true),
      },
    );
  }
  //PageIndex=1&PageSize=10
  getPastExams(page: number = 1, pageSize: number = 2) {
    return this.http.get<IpastExams>(
      `${environment.apiUrl}/StudentExam/past-exams?PageIndex=${page}&PageSize=${pageSize}`,
      {
        context: new HttpContext().set(SkipLoading, true),
      },
    );
  }
}
