import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { PastExam } from '../../models/dashboard.model';
import { IavailableExams } from '../../../../data/models/StudentExam/IavailableExams';

@Component({
  selector: 'app-past-exams-card',
  templateUrl: './past-exams-card.html',
  styleUrl: './past-exams-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PastExamsCardComponent {
  readonly exams = input.required<IavailableExams[]>();
}
