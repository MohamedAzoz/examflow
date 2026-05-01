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
import { IcreateExam } from '../../../../../data/models/ProfessorExam/icreate-exam';

export type CreateExamPayload = Omit<IcreateExam, 'courseId'>;

@Component({
  selector: 'app-create-exam-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-exam-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateExamModalComponent {
  private readonly hasOpenedInCurrentCycle = signal(false);

  readonly visible = input(false);
  readonly submitting = input(false);
  readonly departments = input<readonly IassignDepartments[]>([]);

  readonly closeModal = output<void>();
  readonly submitExam = output<CreateExamPayload>();

  readonly title = signal('');
  readonly startTime = signal('');
  readonly durationMinutes = signal(90);
  readonly passingScore = signal(50);
  readonly totalDegree = signal(100);
  readonly academicLevel = signal(1);
  readonly departmentIds = signal<number[]>([]);
  readonly isRandomQuestions = signal(true);
  readonly isRandomAnswers = signal(false);

  readonly selectedDepartmentName = computed(() => {
    const ids = this.departmentIds();
    if (!ids || ids.length === 0) {
      return 'All departments (general exam for this level)';
    }
    const selectedNames = ids
      .map(id => this.departments().find(d => d.id === id)?.name)
      .filter(name => !!name);
    return selectedNames.join(', ');
  });

  readonly canSubmit = computed(() => {
    const hasTitle = this.title().trim().length > 0;
    const hasStartTime = this.startTime().trim().length > 0;

    const durationValid = this.durationMinutes() > 0;
    const passingValid = this.passingScore() > 0 && this.passingScore() <= 100;
    const totalDegreeValid = this.totalDegree() > 0;
    const levelValid = this.academicLevel() >= 1 && this.academicLevel() <= 6;

    return (
      hasTitle &&
      hasStartTime &&
      durationValid &&
      passingValid &&
      totalDegreeValid &&
      levelValid &&
      !this.submitting()
    );
  });

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const departments = this.departments();

      if (!isVisible) {
        this.hasOpenedInCurrentCycle.set(false);
        return;
      }

      if (!this.hasOpenedInCurrentCycle()) {
        this.resetForm();
        this.hasOpenedInCurrentCycle.set(true);
      }

      const currentIds = this.departmentIds();
      const validIds = currentIds.filter((id) => departments.some((d) => d.id === id));
      if (validIds.length !== currentIds.length) {
        this.departmentIds.set(validIds);
      }
    });
  }
  readonly LevelOptions = [1, 2, 3, 4];

  onBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget || this.submitting()) {
      return;
    }

    this.onClose();
  }

  onClose(): void {
    if (this.submitting()) {
      return;
    }

    this.closeModal.emit();
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.submitExam.emit({
      title: this.title().trim(),
      startTime: this.toUtcIsoString(this.startTime()),
      durationMinutes: this.normalizePositive(this.durationMinutes(), 90),
      passingScore: this.normalizePositive(this.passingScore(), 50),
      totalDegree: this.normalizePositive(this.totalDegree(), 100),
      isRandomQuestions: this.isRandomQuestions(),
      isRandomAnswers: this.isRandomAnswers(),
      academicLevel: this.normalizeRange(this.academicLevel(), 1, 6, 1),
      departmentsIds: this.departmentIds(),
    });
  }

  toNumber(value: string | number | null | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  toggleDepartment(id: number): void {
    const current = this.departmentIds();
    if (current.includes(id)) {
      this.departmentIds.set(current.filter((dId) => dId !== id));
    } else {
      this.departmentIds.set([...current, id]);
    }
  }

  private resetForm(): void {
    this.title.set('');
    this.startTime.set('');
    this.durationMinutes.set(90);
    this.passingScore.set(50);
    this.totalDegree.set(100);
    this.academicLevel.set(1);
    this.departmentIds.set([]);
    this.isRandomQuestions.set(true);
    this.isRandomAnswers.set(false);
  }

  private normalizePositive(value: number, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  private normalizeRange(value: number, min: number, max: number, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  private toUtcIsoString(dateLike: string): string {
    const parsed = new Date(dateLike);
    if (Number.isNaN(parsed.getTime())) {
      return dateLike;
    }

    return parsed.toISOString();
  }
}
