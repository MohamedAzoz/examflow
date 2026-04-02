import { Component, input, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { IavailableExams } from '../../../../data/models/StudentExam/IavailableExams';
import { StudentExamFacade } from '../../services/student-exam-facade';

@Component({
  selector: 'app-active-exams-card',
  templateUrl: './active-exams-card.html',
  styleUrl: './active-exams-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveExamsCardComponent {
  private readonly facade = inject(StudentExamFacade);
  // availableTimeToStart
  readonly IsAvailableToStart = computed(() => this.facade.availableTimeToStart() > 0);

  /** The currently active exam (null if none) */
  readonly activeExam = input<IavailableExams | null>(null);

  /** Formatted countdown string from parent */
  readonly countdown = input<string>('00:00:00');

  joinExam(examId: number): void {
    this.facade.startExam(examId);
  }
}
