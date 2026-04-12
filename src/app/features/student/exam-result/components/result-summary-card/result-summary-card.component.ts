import { ChangeDetectionStrategy, Component, Input, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamStatus } from '../../../../../data/enums/ExamStatus';
import { ExamStatusMeta, getExamStatusMeta } from '../../../../../shared/utils/exam-status-meta';

@Component({
  selector: 'app-result-summary-card',
  imports: [CommonModule],
  templateUrl: './result-summary-card.component.html',
  styleUrl: './result-summary-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultSummaryCardComponent {
  examTitle = input.required<string>();
  studentScore = input.required<number>();
  examMaxScore = input.required<number>();
  timeTaken = input.required<number>();
  examStatus = input.required<ExamStatus>();
  objectiveCount = input.required<number>();
  essayCount = input.required<number>();

  protected readonly percentage = computed(() => {
    if (!this.examMaxScore()) {
      return 0;
    }

    return Math.max(0, Math.min(100, (this.studentScore() / this.examMaxScore()) * 100));
  });

  protected readonly grade = computed(() => {
    const percentage = this.percentage();

    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D+';
    if (percentage >= 50) return 'D';
    return 'F';
  });

  protected readonly progressStyle = computed(() => `${this.percentage()}%`);
  protected readonly statusMeta = computed(() => getExamStatusMeta(this.examStatus()));

  protected readonly progressDashArray = computed(() => {
    const circumference = 2 * Math.PI * 40; // radius = 40
    const offset = circumference - (this.percentage() / 100) * circumference;
    return `${circumference - offset} ${circumference}`;
  });

  protected readonly gradeClass = computed(() => {
    const percentage = this.percentage();
    if (percentage >= 90) return 'grade-a';
    if (percentage >= 80) return 'grade-b';
    if (percentage >= 70) return 'grade-c';
    if (percentage >= 50) return 'grade-d';
    return 'grade-f';
  });
  protected readonly colorGrade = computed(() => {
    const percentage = this.percentage();
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'primary';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'danger';
  });

  protected formatTime(totalMinutes: number): string {
    return `${totalMinutes.toFixed(2)}m`;
  }
}
