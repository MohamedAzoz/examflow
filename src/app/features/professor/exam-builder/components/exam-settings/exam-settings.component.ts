import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
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

  readonly title = signal('');
  readonly passingScore = signal(50);
  readonly totalDegree = signal(100);
  readonly startTime = signal('');
  readonly durationMinutes = signal(90);
  readonly academicLevel = signal(1);
  readonly departmentId = signal(0);
  readonly isRandomQuestions = signal(true);
  readonly isRandomAnswers = signal(false);

  readonly levelOptions = [1, 2, 3, 4] as const;

  readonly selectedDepartmentName = computed(() => {
    const selectedId = this.departmentId();
    if (selectedId <= 0) {
      return 'All departments (general exam for this level)';
    }

    const selected = this.departments().find((department) => department.id === selectedId);
    return selected?.name ?? 'All departments (general exam for this level)';
  });

  readonly canSave = computed(() => {
    const hasTitle = this.title().trim().length > 0;
    const hasStartTime = this.startTime().trim().length > 0;

    const isScoreValid = this.passingScore() >= 1 && this.passingScore() <= 100;
    const isTotalDegreeValid = this.totalDegree() >= 1;
    const isDurationValid = this.durationMinutes() >= 1;
    const isLevelValid = this.academicLevel() >= 1;

    return (
      hasTitle &&
      hasStartTime &&
      isScoreValid &&
      isTotalDegreeValid &&
      isDurationValid &&
      isLevelValid &&
      !this.saving()
    );
  });


  constructor() {
    effect(() => {
      this.isCollapsed.set(this.collapsedByDefault());
    });

    effect(() => {
      const incoming = this.initialSettings();
      if (!incoming) {
        return;
      }

      this.patchFromInput(incoming);
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
    if (!this.canSave()) {
      return;
    }

    this.saveUpdates.emit({
      title: this.title().trim(),
      passingScore: this.passingScore(),
      totalDegree: this.totalDegree(),
      startTime: this.startTime(),
      durationMinutes: this.durationMinutes(),
      academicLevel: this.academicLevel(),
      departmentId: this.departmentId(),
      isRandomQuestions: this.isRandomQuestions(),
      isRandomAnswers: this.isRandomAnswers(),
    });
  }


  toNumber(value: string | number | null | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private patchFromInput(incoming: Partial<ExamSettingsValue>): void {
    if (typeof incoming.title === 'string') {
      this.title.set(incoming.title);
    }

    if (incoming.passingScore !== undefined) {
      this.passingScore.set(this.toNumber(incoming.passingScore, this.passingScore()));
    }

    if (incoming.totalDegree !== undefined) {
      this.totalDegree.set(this.toNumber(incoming.totalDegree, this.totalDegree()));
    }

    if (typeof incoming.startTime === 'string') {
      this.startTime.set(incoming.startTime);
    }

    if (incoming.durationMinutes !== undefined) {
      this.durationMinutes.set(this.toNumber(incoming.durationMinutes, this.durationMinutes()));
    }

    if (incoming.academicLevel !== undefined) {
      this.academicLevel.set(this.toNumber(incoming.academicLevel, this.academicLevel()));
    }

    if (incoming.departmentId !== undefined) {
      this.departmentId.set(this.toNumber(incoming.departmentId, this.departmentId()));
    }

    if (incoming.isRandomQuestions !== undefined) {
      this.isRandomQuestions.set(!!incoming.isRandomQuestions);
    }

    if (incoming.isRandomAnswers !== undefined) {
      this.isRandomAnswers.set(!!incoming.isRandomAnswers);
    }
  }
}
