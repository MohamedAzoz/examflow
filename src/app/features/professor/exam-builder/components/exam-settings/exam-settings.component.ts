import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop'; // مهم جداً للربط بين الفورم والـ Signals
import { merge } from 'rxjs'; // لدمج مراقبة كل الحقول معاً
import { IassignDepartments } from '../../../../../data/models/course/IassignDepartments';

export interface ExamSettingsValue {
  title: string;
  passingScore: number;
  totalDegree: number;
  startTime: string;
  durationMinutes: number;
  academicLevel: number;
  departmentId: number;
  isRandomQuestions: boolean;
  isRandomAnswers: boolean;
}

@Component({
  selector: 'app-exam-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './exam-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamSettingsComponent {
  readonly initialSettings = input<Partial<ExamSettingsValue> | null>(null);
  readonly departments = input<IassignDepartments[]>([]);
  readonly activeCourseName = input<string>('');
  readonly collapsedByDefault = input<boolean>(false);
  readonly saving = input<boolean>(false);

  readonly saveUpdates = output<ExamSettingsValue>();
  readonly collapsedChange = output<boolean>();

  readonly isCollapsed = signal(false);

  // تعريف الحقول
  readonly titleControl = new FormControl('', { nonNullable: true });
  readonly passingScoreControl = new FormControl(50, [Validators.min(1), Validators.max(100)]);
  readonly totalDegreeControl = new FormControl(100, [Validators.min(1)]);
  readonly startTimeControl = new FormControl('', { nonNullable: true });
  readonly durationMinutesControl = new FormControl(90, [Validators.min(1)]);
  readonly academicLevelControl = new FormControl(1, [Validators.min(1)]);
  readonly departmentIdControl = new FormControl(0);
  readonly isRandomQuestionsControl = new FormControl(true);
  readonly isRandomAnswersControl = new FormControl(false);

  readonly levelOptions = [1, 2, 3, 4] as const;

  /** 
   * التعديل الجوهري: 
   * ننشئ Signal يراقب "تغيرات القيم" و "تغيرات الحالة" لكل الحقول.
   * بمجرد أن يتغير أي حقل، سيقوم هذا الـ Signal بإخطار الـ computed لإعادة الحساب.
   */
  private readonly formUpdateTrigger = toSignal(
    merge(
      this.titleControl.valueChanges,
      this.passingScoreControl.valueChanges,
      this.totalDegreeControl.valueChanges,
      this.startTimeControl.valueChanges,
      this.durationMinutesControl.valueChanges,
      this.academicLevelControl.valueChanges,
      this.departmentIdControl.valueChanges,
      this.isRandomQuestionsControl.valueChanges,
      this.isRandomAnswersControl.valueChanges,
      this.titleControl.statusChanges // نراقب الحالة أيضاً (Valid/Invalid)
    )
  );

  // الآن هذا الـ computed سيتم استدعاؤه مع كل ضغطة زر
  readonly canSave = computed(() => {
    // استدعاء الـ trigger لربط الـ computed بدورة حياة الفورم
    this.formUpdateTrigger(); 

    const hasRequiredFields = !!(this.titleControl.value?.trim() && this.startTimeControl.value);
    
    const isFormValid =
      this.titleControl.valid &&
      this.passingScoreControl.valid &&
      this.totalDegreeControl.valid &&
      this.startTimeControl.valid &&
      this.durationMinutesControl.valid &&
      this.academicLevelControl.valid &&
      this.departmentIdControl.valid;

    return isFormValid && hasRequiredFields && !this.saving();
  });

  // جعل عرض اسم القسم المختار تفاعلياً أيضاً
  readonly selectedDepartmentName = computed(() => {
    this.formUpdateTrigger(); // لكي يتحدث النص فور اختيار قسم جديد
    const selectedId = this.departmentIdControl.value;
    
    if (selectedId === 0 || !selectedId) {
      return 'All departments (general exam for this level)';
    }

    const selected = this.departments().find((d) => d.id === selectedId);
    return selected?.name ?? 'All departments (general exam for this level)';
  });

  constructor() {
    effect(() => {
      this.isCollapsed.set(this.collapsedByDefault());
    });

    effect(() => {
      const incoming = this.initialSettings();
      if (incoming) {
        this.patchFromInput(incoming);
      }
    });
  }

  collapse(): void {
    this.isCollapsed.set(true);
    this.collapsedChange.emit(true);
  }

  expand(): void {
    this.isCollapsed.set(false);
    this.collapsedChange.emit(false);
  }

  onSaveUpdates(): void {
    if (!this.canSave()) return;

    this.saveUpdates.emit({
      title: this.titleControl.value.trim(),
      passingScore: this.passingScoreControl.value!,
      totalDegree: this.totalDegreeControl.value!,
      startTime: this.startTimeControl.value,
      durationMinutes: this.durationMinutesControl.value!,
      academicLevel: this.academicLevelControl.value!,
      departmentId: this.departmentIdControl.value!,
      isRandomQuestions: this.isRandomQuestionsControl.value!,
      isRandomAnswers: this.isRandomAnswersControl.value!,
    });
  }

  private toNumber(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private patchFromInput(incoming: Partial<ExamSettingsValue>): void {
    if (incoming.title !== undefined) this.titleControl.setValue(incoming.title);
    if (incoming.passingScore !== undefined) this.passingScoreControl.setValue(this.toNumber(incoming.passingScore, 50));
    if (incoming.totalDegree !== undefined) this.totalDegreeControl.setValue(this.toNumber(incoming.totalDegree, 100));
    if (incoming.startTime !== undefined) this.startTimeControl.setValue(incoming.startTime);
    if (incoming.durationMinutes !== undefined) this.durationMinutesControl.setValue(this.toNumber(incoming.durationMinutes, 90));
    if (incoming.academicLevel !== undefined) this.academicLevelControl.setValue(this.toNumber(incoming.academicLevel, 1));
    if (incoming.departmentId !== undefined) this.departmentIdControl.setValue(this.toNumber(incoming.departmentId, 0));
    if (incoming.isRandomQuestions !== undefined) this.isRandomQuestionsControl.setValue(!!incoming.isRandomQuestions);
    if (incoming.isRandomAnswers !== undefined) this.isRandomAnswersControl.setValue(!!incoming.isRandomAnswers);
  }
}