import { Component, inject, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardFacade } from './services/dashboard.facade';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards';
import { GradeDistributionComponent } from './components/grade-distribution/grade-distribution';
import { UpcomingExamsComponent } from './components/upcoming-exams/upcoming-exams';
import { RecentExamsComponent } from './components/recent-exams/recent-exams';
import { PendingGradingComponent } from './components/pending-grading/pending-grading';
import { RecentExamSearchParams } from '../../../data/models/ProfessorDashboard/RecentExamSearchParams';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfessorExam } from '../../../data/services/professor-exam';
import { RecentExamData } from '../../../data/models/ProfessorDashboard/RecentExamData';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardsComponent,
    GradeDistributionComponent,
    UpcomingExamsComponent,
    RecentExamsComponent,
    PendingGradingComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  public readonly facade = inject(DashboardFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly examService = inject(ProfessorExam);

  constructor() {
    effect(
      () => {
        const lastExams = this.facade.lastExamsResource.value();
        const currentSelected = this.facade.selectedDistributionExamId();
        if (lastExams && lastExams.length > 0 && currentSelected === null) {
          this.facade.setSelectedDistributionExam(lastExams[0].id);
        }
      },
      { allowSignalWrites: true },
    );
  }

  onDistributionExamChange(examId: number): void {
    this.facade.setSelectedDistributionExam(examId);
  }

  onRecentExamsSearchChange(params: Partial<RecentExamSearchParams>): void {
    this.facade.setRecentExamsSearch(params);
  }

  onDownloadReport(exam: RecentExamData): void {
    const id = exam.examId;
    this.examService
      .getExamResultsReport(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: Blob) => {
          const url = window.URL.createObjectURL(response);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${exam.courseName}_${exam.examTitle}_results.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (err) => console.error('Failed to download report', err),
      });
  }
}
