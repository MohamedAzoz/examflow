import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IexamDetailsData } from '../../../../../data/models/ProfessorExam/IexamDetails';
import {
  getExamStatusBadgeClass,
  isDraftExamStatus,
} from '../../../../../shared/utils/exam-status.utils';

@Component({
  selector: 'app-exams-table',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './exams-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamsTableComponent {
  readonly exams = input<readonly IexamDetailsData[]>([]);

  readonly openBuilder = output<IexamDetailsData>();
  readonly publishExam = output<IexamDetailsData>();
  readonly deleteExam = output<IexamDetailsData>();

  trackByExamId(_: number, exam: IexamDetailsData): number {
    return exam.id;
  }

  isDraftStatus(status: string): boolean {
    return isDraftExamStatus(status);
  }

  statusBadgeClass(status: string): string {
    return getExamStatusBadgeClass(status);
  }

  onOpenBuilder(exam: IexamDetailsData): void {
    this.openBuilder.emit(exam);
  }

  onPublishExam(exam: IexamDetailsData): void {
    this.publishExam.emit(exam);
  }

  onDeleteExam(exam: IexamDetailsData): void {
    this.deleteExam.emit(exam);
  }
}
