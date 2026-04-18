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
import { IassignDepartments } from '../../../../../data/models/course/IassignDepartments';

export interface ExamEditorSubmitPayload {
  title: string;
  startTime: string;
  durationMinutes: number;
  passingScore: number;
  totalDegree: number;
  academicLevel: number;
  departmentsIds: number[];
  isRandomQuestions: boolean;
  isRandomAnswers: boolean;
}

@Component({
  selector: 'app-exam-editor-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exam-editor-modal.component.html',
  styleUrl: './exam-editor-modal.component.css',
})
export class ExamEditorModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() departments: IassignDepartments[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() submitExam = new EventEmitter<ExamEditorSubmitPayload>();

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    startTime: ['', [Validators.required]],
    durationMinutes: [120, [Validators.required, Validators.min(1)]],
    passingScore: [50, [Validators.required, Validators.min(1), Validators.max(100)]],
    totalDegree: [100, [Validators.required, Validators.min(1)]],
    academicLevel: [1, [Validators.required]],
    departmentsIds: [[] as number[], [Validators.required]],
    isRandomQuestions: [true],
    isRandomAnswers: [false],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible || !changes['visible']) {
      return;
    }

    this.resetForCreate();
  }

  protected close(): void {
    this.closeModal.emit();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    const payload: ExamEditorSubmitPayload = {
      title: value.title.trim(),
      startTime: value.startTime,
      durationMinutes: Number(value.durationMinutes),
      passingScore: Number(value.passingScore),
      totalDegree: Number(value.totalDegree),
      academicLevel: Number(value.academicLevel),
      departmentsIds: value.departmentsIds || [],
      isRandomQuestions: !!value.isRandomQuestions,
      isRandomAnswers: !!value.isRandomAnswers,
    };

    this.submitExam.emit(payload);
  }

  private resetForCreate(): void {
    this.form.reset({
      title: '',
      startTime: '',
      durationMinutes: 120,
      passingScore: 50,
      totalDegree: 100,
      academicLevel: 1,
      departmentsIds: [],
      isRandomQuestions: true,
      isRandomAnswers: false,
    });
  }
}
