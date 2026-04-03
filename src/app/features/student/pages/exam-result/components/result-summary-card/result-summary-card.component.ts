import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamStatus } from '../../../../../../data/enums/ExamStatus';
import { getExamStatusMeta } from '../../../../../../shared/utils/exam-status-meta';

@Component({
  selector: 'app-result-summary-card',
  imports: [CommonModule],
  templateUrl: './result-summary-card.component.html',
  styleUrl: './result-summary-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultSummaryCardComponent {
  @Input({ required: true }) examTitle!: string;
  @Input({ required: true }) studentScore!: number;
  @Input({ required: true }) examMaxScore!: number;
  @Input({ required: true }) timeTaken!: number;
  @Input({ required: true }) examStatus!: ExamStatus;
  @Input({ required: true }) objectiveCount!: number;
  @Input({ required: true }) essayCount!: number;

  protected readonly percentage = computed(() => {
    if (!this.examMaxScore) {
      return 0;
    }

    return Math.max(0, Math.min(100, (this.studentScore / this.examMaxScore) * 100));
  });

  protected readonly grade = computed(() => {
    const percentage = this.percentage();

    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  });

  protected readonly progressStyle = computed(() => `${this.percentage()}%`);
  protected readonly statusMeta = computed(() => getExamStatusMeta(this.examStatus));

  protected formatTime(totalMinutes: number): string {
    const safeValue = Math.max(0, totalMinutes);
    const hours = Math.floor(safeValue / 60);
    const minutes = safeValue % 60;

    if (hours === 0) {
      return `${minutes} min`;
    }

    return `${hours}h ${minutes}m`;
  }
}
