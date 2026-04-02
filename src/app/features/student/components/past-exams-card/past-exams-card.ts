import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { data } from '../../../../data/models/StudentExam/IpastExams';
import { ExamStatus } from '../../../../data/enums/ExamStatus';

@Component({
  selector: 'app-past-exams-card',
  templateUrl: './past-exams-card.html',
  styleUrl: './past-exams-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PastExamsCardComponent {
  readonly exams = input.required<data[]>();
  readonly ExamStatus = ExamStatus;

  getDegree(score: number, maxScore: number): number {
    return Math.round((score / maxScore) * 100);
  }
  getExamStatus(status: ExamStatus): string {
    switch (status) {
      case ExamStatus.NotStarted:
        return 'Absent';
      case ExamStatus.InProgress:
        return 'In Progress';
      case ExamStatus.Completed:
        return 'Submitted';
      case ExamStatus.Flushed:
        return 'Evaluating';
      case ExamStatus.PendingEassysManualGrading:
        return 'Pending Review';
      case ExamStatus.AllGraded:
        return 'Completed';
      default:
        return 'Unknown';
    }
  }
}
