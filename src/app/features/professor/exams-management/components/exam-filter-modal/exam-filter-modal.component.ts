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
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ExamSortingOptions } from '../../../../../data/enums/ExamSortingOptions';
import { ProfessorExamStatus } from '../../../../../data/enums/ProfessorExamStatus';
import { Iexamdetails } from '../../../../../data/models/ProfessorExam/Iexamdetails.1';
import { IDepartmentById } from '../../../../../data/models/department/idepartment-by-id';
import { IassignDepartments } from '../../../../../data/models/course/IassignDepartments';

@Component({
  selector: 'app-exam-filter-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exam-filter-modal.component.html',
  styleUrl: './exam-filter-modal.component.css',
})
export class ExamFilterModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() visible = false;
  @Input() departments: IassignDepartments[] = [];
  @Input() currentCourseId: number | null = null;
  @Input() initialFilters: Iexamdetails | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() applyFilter = new EventEmitter<Partial<Iexamdetails>>();
  @Output() resetFilter = new EventEmitter<void>();

  protected readonly sortOptions = [
    { label: 'Start Time (Newest)', value: ExamSortingOptions.StartTimeDesc },
    { label: 'Start Time (Oldest)', value: ExamSortingOptions.StartTimeAsc },
    { label: 'Title (A-Z)', value: ExamSortingOptions.TitleAsc },
    { label: 'Title (Z-A)', value: ExamSortingOptions.TitleDesc },
  ];

  protected readonly statusOptions = [
    { label: 'Draft', value: ProfessorExamStatus.Draft },
    { label: 'Published', value: ProfessorExamStatus.Published },
    { label: 'Completed', value: ProfessorExamStatus.Completed },
    { label: 'Pending Manual Grading', value: ProfessorExamStatus.PendingManualGrading },
    { label: 'All Graded', value: ProfessorExamStatus.AllGraded },
  ];

  protected readonly levelOptions = [1, 2, 3, 4, 5, 6];

  protected readonly form = this.fb.group({
    courseId: [''],
    academicLevel: [''],
    departmentId: [''],
    sorting: [''],
    examStatus: [''],
    semesterId: [''],
    searchTitle: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      return;
    }

    if (changes['visible'] || changes['initialFilters'] || changes['currentCourseId']) {
      this.patchForm();
    }
  }

  protected close(): void {
    this.closeModal.emit();
  }

  protected toggleLevel(level: number): void {
    const current = Number(this.form.value.academicLevel || 0);
    this.form.patchValue({
      academicLevel: current === level ? '' : String(level),
    });
  }

  protected isLevelActive(level: number): boolean {
    return Number(this.form.value.academicLevel || 0) === level;
  }

  protected onReset(): void {
    this.form.reset({
      courseId: this.currentCourseId ? String(this.currentCourseId) : '',
      academicLevel: '',
      departmentId: '',
      sorting: '',
      examStatus: '',
      semesterId: '',
      searchTitle: '',
    });

    this.resetFilter.emit();
  }

  protected onApply(): void {
    const value = this.form.getRawValue();

    this.applyFilter.emit({
      courseId: this.toNullableNumber(value.courseId),
      academicLevel: this.toNullableNumber(value.academicLevel),
      departmentId: this.toNullableNumber(value.departmentId),
      sorting: this.toNullableNumber(value.sorting),
      examStatus: this.toNullableNumber(value.examStatus),
      semesterId: this.toNullableNumber(value.semesterId),
      searchTitle: this.toNullableString(value.searchTitle),
    });
  }

  private patchForm(): void {
    const filters = this.initialFilters;

    this.form.reset({
      courseId: this.toInputValue(filters?.courseId ?? this.currentCourseId),
      academicLevel: this.toInputValue(filters?.academicLevel),
      departmentId: this.toInputValue(filters?.departmentId),
      sorting: this.toInputValue(filters?.sorting),
      examStatus: this.toInputValue(filters?.examStatus),
      semesterId: this.toInputValue(filters?.semesterId),
      searchTitle: filters?.searchTitle ?? '',
    });
  }

  private toNullableNumber(value: string | null | undefined): number | null {
    if (!value || value.trim().length === 0) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toNullableString(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private toInputValue(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  }
}
