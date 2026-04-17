import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IexamDetailsData } from '../../../../../data/models/ProfessorExam/IexamDetails';

@Component({
  selector: 'app-exams-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exams-table.component.html',
  styleUrl: './exams-table.component.css',
})
export class ExamsTableComponent {
  @Input() exams: IexamDetailsData[] = [];

  @Output() editExam = new EventEmitter<IexamDetailsData>();
  @Output() deleteExam = new EventEmitter<IexamDetailsData>();
  @Output() publishExam = new EventEmitter<IexamDetailsData>();

  protected onEdit(exam: IexamDetailsData): void {
    this.editExam.emit(exam);
  }

  protected onDelete(exam: IexamDetailsData): void {
    this.deleteExam.emit(exam);
  }

  protected onPublish(exam: IexamDetailsData): void {
    this.publishExam.emit(exam);
  }

  protected resolveLevel(level: number): string {
    if (!Number.isFinite(level) || level < 1 || level > 6) {
      return 'Level 1';
    }

    return `Level ${level}`;
  }

  protected resolveStatusClass(status: string): string {
    const value = status.toLowerCase();

    if (value.includes('publish')) {
      return 'bg-emerald-100 text-emerald-700';
    }

    if (value.includes('complete') || value.includes('graded')) {
      return 'bg-cyan-100 text-cyan-700';
    }

    return 'bg-slate-100 text-slate-700';
  }

  protected formatDateTime(dateLike: Date): string {
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const dateValue = date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const timeValue = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${dateValue} ${timeValue}`;
  }
}
