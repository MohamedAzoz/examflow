import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IexamDetailsData } from '../../../../../data/models/ProfessorExam/IexamDetails';
import { IupdateExam } from '../../../../../data/models/ProfessorExam/IupdateExam';
import { IassignDepartments } from '../../../../../data/models/course/IassignDepartments';

@Component({
  selector: 'app-exam-settings-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exam-settings-panel.component.html',
  styleUrl: './exam-settings-panel.component.css',
})
export class ExamSettingsPanelComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() exam: IexamDetailsData | null = null;
  @Input() departments: IassignDepartments[] = [];
  @Input() saving = false;
  @Input() publishing = false;

  @Output() saveSettings = new EventEmitter<IupdateExam>();
  @Output() publishExam = new EventEmitter<void>();

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    startTime: ['', [Validators.required]],
    durationMinutes: [120, [Validators.required, Validators.min(1)]],
    passingScore: [50, [Validators.required, Validators.min(1), Validators.max(100)]],
    totalDegree: [100, [Validators.required, Validators.min(1)]],
    departmentId: [0, [Validators.required, Validators.min(1)]],
    isRandomQuestions: [true],
    isRandomAnswers: [false],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['exam'] || changes['departments']) {
      this.patchFromExam();
    }
  }

  protected onSave(): void {
    if (!this.exam || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.saveSettings.emit({
      id: this.exam.id,
      title: value.title.trim(),
      startTime: value.startTime,
      durationMinutes: Number(value.durationMinutes),
      passingScore: Number(value.passingScore),
      isRandomQuestions: !!value.isRandomQuestions,
      isRandomAnswers: !!value.isRandomAnswers,
      totalDegree: Number(value.totalDegree),
      academicLevel: 4,
      departmentId: Number(value.departmentId),
    });
  }

  protected onPublish(): void {
    this.publishExam.emit();
  }

  private patchFromExam(): void {
    if (!this.exam) {
      return;
    }

    this.form.patchValue({
      title: this.exam.title,
      startTime: this.toLocalDateTimeInput(this.exam.startTime),
      durationMinutes: this.exam.durationMinutes,
      passingScore: this.exam.passingScore,
      totalDegree: this.exam.totalDegree,
      departmentId: this.resolveDepartmentId(this.exam),
      isRandomQuestions: this.exam.isRandomQuestions,
      isRandomAnswers: this.exam.isRandomAnswers,
    });
  }

  private resolveDepartmentId(exam: IexamDetailsData): number {
    for (const department of this.departments) {
      if (exam.departmentNames.includes(department.name)) {
        return department.id;
      }
    }

    return this.departments[0]?.id ?? 0;
  }

  private toLocalDateTimeInput(dateLike: Date): string {
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const pad = (value: number) => value.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
