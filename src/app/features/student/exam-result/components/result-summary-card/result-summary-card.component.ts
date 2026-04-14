import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamStatus } from '../../../../../data/enums/ExamStatus';
import { getExamStatusMeta } from '../../../../../shared/utils/exam-status-meta';

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

  protected readonly statusMeta = computed(() => getExamStatusMeta(this.examStatus()));

  protected readonly gradeTheme = computed(() => {
    const percentage = this.percentage();

    if (percentage >= 90) {
      return {
        ringColor: '#299e5b',
        statBackground: 'rgba(41, 158, 91, 0.10)',
        statBorder: 'rgba(41, 158, 91, 0.38)',
      };
    }

    if (percentage >= 80) {
      return {
        ringColor: '#13626c',
        statBackground: 'rgba(19, 98, 108, 0.10)',
        statBorder: 'rgba(19, 98, 108, 0.36)',
      };
    }

    if (percentage >= 70) {
      return {
        ringColor: '#0f92af',
        statBackground: 'rgba(15, 146, 175, 0.10)',
        statBorder: 'rgba(15, 146, 175, 0.36)',
      };
    }

    if (percentage >= 50) {
      return {
        ringColor: '#f59e0b',
        statBackground: 'rgba(245, 158, 11, 0.12)',
        statBorder: 'rgba(245, 158, 11, 0.38)',
      };
    }

    return {
      ringColor: '#bc3e3e',
      statBackground: 'rgba(188, 62, 62, 0.10)',
      statBorder: 'rgba(188, 62, 62, 0.38)',
    };
  });

  protected readonly scoreRingBackground = computed(() => {
    return [
      'radial-gradient(closest-side, rgba(255, 255, 255, 0.95) 73%, transparent 74% 100%)',
      `conic-gradient(${this.gradeTheme().ringColor} ${this.percentage()}%, rgba(191, 200, 202, 0.45) 0)`,
    ].join(', ');
  });

  protected readonly statusToneStyle = computed(() => {
    const status = this.examStatus();

    switch (status) {
      case ExamStatus.NotStarted:
        return {
          color: '#bc3e3e',
          borderColor: 'rgba(188, 62, 62, 0.35)',
          backgroundColor: 'rgba(188, 62, 62, 0.12)',
        };
      case ExamStatus.InProgress:
        return {
          color: '#13626c',
          borderColor: 'rgba(19, 98, 108, 0.34)',
          backgroundColor: 'rgba(19, 98, 108, 0.13)',
        };
      case ExamStatus.Completed:
        return {
          color: '#13626c',
          borderColor: 'rgba(19, 98, 108, 0.34)',
          backgroundColor: 'rgba(19, 98, 108, 0.13)',
        };
      case ExamStatus.Flushed:
        return {
          color: '#b36700',
          borderColor: 'rgba(245, 158, 11, 0.34)',
          backgroundColor: 'rgba(245, 158, 11, 0.14)',
        };
      case ExamStatus.PendingEassysManualGrading:
        return {
          color: '#6d28d9',
          borderColor: 'rgba(109, 40, 217, 0.32)',
          backgroundColor: 'rgba(109, 40, 217, 0.12)',
        };
      case ExamStatus.AllGraded:
        return {
          color: '#1f8a4d',
          borderColor: 'rgba(41, 158, 91, 0.34)',
          backgroundColor: 'rgba(41, 158, 91, 0.12)',
        };
      default:
        return {
          color: '#475569',
          borderColor: 'rgba(100, 116, 139, 0.30)',
          backgroundColor: 'rgba(100, 116, 139, 0.14)',
        };
    }
  });

  protected formatTime(totalMinutes: number): string {
    if (totalMinutes < 60) {
      return `${totalMinutes.toFixed(2)}m`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  }
}
