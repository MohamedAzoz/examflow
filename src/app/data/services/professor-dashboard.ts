import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { KPI } from '../models/ProfessorDashboard/KPI';
import { Charts } from '../models/ProfessorDashboard/Charts';
import { LastExam } from '../models/ProfessorDashboard/LastExam';
import { IPaginatedResponse } from '../models/IPaginatedResponse';
import { UpcomingExamData } from '../models/ProfessorDashboard/UpcomingExamData';
import { RecentExamData } from '../models/ProfessorDashboard/RecentExamData';
import { RecentExamSearchParams } from '../models/ProfessorDashboard/RecentExamSearchParams';
import { PendingGradingData } from '../models/ProfessorDashboard/PendingGradingData';
import { SkipLoading } from '../../core/interceptors/loading-interceptor';

@Injectable({
  providedIn: 'root',
})
export class ProfessorDashboard {
  private readonly http = inject(HttpClient);
  //   GET
  // /api/ProfessorDashboard/KPIs
  getKpis() {
    return this.http.get<KPI>(`${environment.apiUrl}/ProfessorDashboard/KPIs`);
  }

  // GET
  // /api/ProfessorDashboard/exam-distribution/{ExamId}
  getExamDistribution(examId: number) {
    return this.http.get<Charts>(
      `${environment.apiUrl}/ProfessorDashboard/exam-distribution/${examId}`,
    );
  }

  // GET
  // /api/ProfessorDashboard/last-exams
  getLastExams() {
    return this.http.get<LastExam[]>(`${environment.apiUrl}/ProfessorDashboard/last-exams`);
  }

  // GET
  // /api/ProfessorDashboard/upcoming-exams
  getUpcomingExams(PageSize: number = 5, PageIndex: number = 1) {
    return this.http.get<IPaginatedResponse<UpcomingExamData>>(
      `${environment.apiUrl}/ProfessorDashboard/upcoming-exams?PageSize=${PageSize}&PageIndex=${PageIndex}`,
      {
        context: new HttpContext().set(SkipLoading, true),
      },
    );
  }

  // GET
  // /api/ProfessorDashboard/recent-exams
  getRecentExams(Search: RecentExamSearchParams) {
    let params = `PageIndex=${Search.PageIndex}&PageSize=${Search.PageSize}&SortingOptions=${Search.SortingOptions}`;
    if (Search.ExamTitleSearch) {
      params += `&ExamTitleSearch=${Search.ExamTitleSearch}`;
    }
    return this.http.get<IPaginatedResponse<RecentExamData>>(
      `${environment.apiUrl}/ProfessorDashboard/recent-exams?${params}`,
      {
        context: new HttpContext().set(SkipLoading, true),
      },
    );
  }

  // GET
  // /api/ProfessorDashboard/pending-grading
  getPendingGrading() {
    return this.http.get<PendingGradingData[]>(
      `${environment.apiUrl}/ProfessorDashboard/pending-grading`,
    );
  }
}
