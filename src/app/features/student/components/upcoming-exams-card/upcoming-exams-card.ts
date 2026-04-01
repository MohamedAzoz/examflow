import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { IavailableExams } from '../../../../data/models/StudentExam/IavailableExams';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-upcoming-exams-card',
  imports: [DatePipe],
  templateUrl: './upcoming-exams-card.html',
  styleUrl: './upcoming-exams-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingExamsCardComponent {
  readonly exams = input.required<IavailableExams[]>();
}
