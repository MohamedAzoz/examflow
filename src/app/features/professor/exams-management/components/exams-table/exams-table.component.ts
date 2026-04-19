import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IexamDetailsData } from '../../../../../data/models/ProfessorExam/IexamDetails';
import {
  getExamStatusBadgeClass,
  isDraftExamStatus,
  isPublishedExamStatus,
  isCompletedExamStatus,
  isPendingGradingExamStatus,
  isAllGradedExamStatus,
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
  readonly gradeEssays = output<IexamDetailsData>();
  readonly downloadPdf = output<IexamDetailsData>();

  trackByExamId(_: number, exam: IexamDetailsData): number {
    return exam.id;
  }

  isDraftStatus(status: string | number | undefined): boolean {
    return isDraftExamStatus(status);
  }

  isPublishedStatus(status: string | number | undefined): boolean {
    return isPublishedExamStatus(status);
  }

  isCompletedStatus(status: string | number | undefined): boolean {
    return isCompletedExamStatus(status);
  }

  isPendingGradingStatus(status: string | number | undefined): boolean {
    return isPendingGradingExamStatus(status);
  }

  isAllGradedStatus(status: string | number | undefined): boolean {
    return isAllGradedExamStatus(status);
  }

  statusBadgeClass(status: string | number | undefined): string {
    return getExamStatusBadgeClass(status);
  }

  getStatusIcon(status: string | number | undefined): string {
    if (this.isPublishedStatus(status)) return 'pi pi-check-circle';
    if (this.isAllGradedStatus(status)) return 'pi pi-check-square'; // Replace with double check equivalent if desired
    if (this.isPendingGradingStatus(status)) return 'pi pi-pencil';
    if (this.isCompletedStatus(status)) return 'pi pi-calendar';
    if (this.isDraftStatus(status)) return 'pi pi-file';
    return 'pi pi-info-circle';
  }

  getDisplayStatus(status: string | number | undefined): string {
    if (this.isPublishedStatus(status)) return 'Published';
    if (this.isAllGradedStatus(status)) return 'All Graded';
    if (this.isPendingGradingStatus(status)) return 'Pending Essays Grading';
    if (this.isCompletedStatus(status)) return 'Completed';
    if (this.isDraftStatus(status)) return 'Draft';
    return String(status);
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

  onGradeEssays(exam: IexamDetailsData): void {
    this.gradeEssays.emit(exam);
  }

  onDownloadPdf(exam: IexamDetailsData): void {
    this.downloadPdf.emit(exam);
  }
}
