import { inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { ProfessorDashboard } from '../../../../data/services/professor-dashboard';
import { KPI } from '../../../../data/models/ProfessorDashboard/KPI';
import { Charts } from '../../../../data/models/ProfessorDashboard/Charts';
import { LastExam } from '../../../../data/models/ProfessorDashboard/LastExam';
import { IPaginatedResponse } from '../../../../data/models/IPaginatedResponse';
import { UpcomingExamData } from '../../../../data/models/ProfessorDashboard/UpcomingExamData';
import { RecentExamData } from '../../../../data/models/ProfessorDashboard/RecentExamData';
import { RecentExamSearchParams } from '../../../../data/models/ProfessorDashboard/RecentExamSearchParams';
import { PendingGradingData } from '../../../../data/models/ProfessorDashboard/PendingGradingData';

@Injectable({
  providedIn: 'root',
})
export class DashboardFacade {
  private readonly dashboardService = inject(ProfessorDashboard);

  // public downloadExamReport(examId: number): void {

  // }

  // --- KPIs ---
  private readonly loadKpisTrigger = signal<boolean>(true);
  public readonly kpisResource = rxResource<KPI | null, boolean>({
    params: () => this.loadKpisTrigger(),
    stream: ({ params }) => {
      if (params) {
        return this.dashboardService.getKpis();
      }
      return of(null);
    },
  });

  // --- Last Exams ---
  private readonly loadLastExamsTrigger = signal<boolean>(true);
  public readonly lastExamsResource = rxResource<LastExam[] | null, boolean>({
    params: () => this.loadLastExamsTrigger(),
    stream: ({ params }) => {
      if (params) {
        return this.dashboardService.getLastExams();
      }
      return of(null);
    },
  });

  // --- Exam Distribution ---
  // The selected exam ID for the grade distribution chart
  public readonly selectedDistributionExamId = signal<number | null>(null);

  public setSelectedDistributionExam(examId: number): void {
    this.selectedDistributionExamId.set(examId);
  }

  public readonly examDistributionResource = rxResource<Charts | null, number | null>({
    params: () => this.selectedDistributionExamId(),
    stream: ({ params: examId }) => {
      if (examId !== null) {
        return this.dashboardService.getExamDistribution(examId);
      }
      return of(null);
    },
  });

  // --- Upcoming Exams ---
  private readonly upcomingExamsPageSize = signal<number>(5);
  private readonly upcomingExamsPageIndex = signal<number>(1);

  public readonly upcomingExamsRequest = signal({
    pageSize: this.upcomingExamsPageSize(),
    pageIndex: this.upcomingExamsPageIndex(),
  });

  public readonly upcomingExamsResource = rxResource<
    IPaginatedResponse<UpcomingExamData> | null,
    any
  >({
    params: () => this.upcomingExamsRequest(),
    stream: ({ params: request }) => {
      if (request) {
        return this.dashboardService.getUpcomingExams(request.pageSize, request.pageIndex);
      }
      return of(null);
    },
  });

  // --- Recent Exams ---
  public readonly recentExamsSearchParams = signal<RecentExamSearchParams>({
    SortingOptions: 0, // DateDesc default
    PageIndex: 1,
    PageSize: 5,
    ExamTitleSearch: '',
  });

  public setRecentExamsSearch(params: Partial<RecentExamSearchParams>): void {
    this.recentExamsSearchParams.update((current) => ({ ...current, ...params }));
  }

  public readonly recentExamsResource = rxResource<
    IPaginatedResponse<RecentExamData> | null,
    RecentExamSearchParams
  >({
    params: () => this.recentExamsSearchParams(),
    stream: ({ params }) => {
      if (params) {
        return this.dashboardService.getRecentExams(params);
      }
      return of(null);
    },
  });

  // --- Pending Grading ---
  private readonly loadPendingGradingTrigger = signal<boolean>(true);
  public readonly pendingGradingResource = rxResource<PendingGradingData[] | null, boolean>({
    params: () => this.loadPendingGradingTrigger(),
    stream: ({ params }) => {
      if (params) {
        return this.dashboardService.getPendingGrading();
      }
      return of(null);
    },
  });

  // Refresh actions
  public refreshAll(): void {
    this.loadKpisTrigger.set(!this.loadKpisTrigger());
    this.loadLastExamsTrigger.set(!this.loadLastExamsTrigger());
    this.loadPendingGradingTrigger.set(!this.loadPendingGradingTrigger());
    this.upcomingExamsRequest.set({ ...this.upcomingExamsRequest() });
    this.recentExamsSearchParams.set({ ...this.recentExamsSearchParams() });

    const currentDistributionExam = this.selectedDistributionExamId();
    if (currentDistributionExam) {
      this.selectedDistributionExamId.set(currentDistributionExam);
    }
  }
}
