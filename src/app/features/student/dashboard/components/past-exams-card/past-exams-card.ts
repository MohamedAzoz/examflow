import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { data } from '../../../../../data/models/StudentExam/IpastExams';
import { ExamStatus } from '../../../../../data/enums/ExamStatus';
import { getExamStatusMeta } from '../../../../../shared/utils/exam-status-meta';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-past-exams-card',
  imports: [],
  templateUrl: './past-exams-card.html',
  styleUrl: './past-exams-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PastExamsCardComponent {
  readonly exams = input.required<data[]>();
  readonly ExamStatus = ExamStatus;

  getMeta(status: ExamStatus) {
    return getExamStatusMeta(status);
  }

  getPercentage(exam: data): number {
    if (!exam.examMaxScore) return 0;
    return Math.round((exam.studentScore / exam.examMaxScore) * 100);
  }
}
