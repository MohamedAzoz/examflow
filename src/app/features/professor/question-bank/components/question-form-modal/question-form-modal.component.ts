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
import { QuestionType } from '../../../../../data/enums/question-type';
import { IQuestionRequest } from '../../../../../data/models/question/iquestion-request';
import { IQuestionResponse } from '../../../../../data/models/question/iquestion-response';

export type QuestionFormMode = 'create' | 'edit';

export interface QuestionFormSavePayload {
  mode: QuestionFormMode;
  id: number | null;
  request: IQuestionRequest;
}

@Component({
  selector: 'app-question-form-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './question-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionFormModalComponent {
  readonly visible = input(false);
  readonly mode = input<QuestionFormMode>('create');
  readonly saving = input(false);
  readonly courseId = input(0);
  readonly question = input<IQuestionResponse | null>(null);

  readonly closeModal = output<void>();
  readonly saveQuestion = output<QuestionFormSavePayload>();

  readonly text = signal('');
  readonly questionType = signal<QuestionType>(QuestionType.MultipleChoice);
  readonly degree = signal(1);
  readonly mcqOptions = signal<string[]>(['Option 1', 'Option 2']);
  readonly correctOptionIndex = signal(0);
  readonly mediaFileName = signal<string | null>(null);

  readonly isMcq = computed(() => this.questionType() === QuestionType.MultipleChoice);
  readonly isTrueFalse = computed(() => this.questionType() === QuestionType.TrueFalse);
  readonly isEssay = computed(() => this.questionType() === QuestionType.Essay);
 

  readonly answerChoices = computed(() => {
    if (this.isEssay()) {
      return [] as string[];
    }

    if (this.isTrueFalse()) {
      return ['True', 'False'];
    }

    return this.normalizeMcqOptions(this.mcqOptions());
  });

  readonly canSave = computed(() => {
    if (this.saving()) {
      return false;
    }

    if (this.courseId() <= 0) {
      return false;
    }

    if (this.text().trim().length === 0 || this.degree() <= 0) {
      return false;
    }

    if (this.questionType() === QuestionType.Essay) {
      return true;
    }

    const choices = this.answerChoices();
    const currentIndex = this.correctOptionIndex();

    return choices.length > 0 && currentIndex >= 0 && currentIndex < choices.length;
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }

      this.applyInitialState();
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.onClose();
  }

  onClose(): void {
    if (this.saving()) {
      return;
    }

    this.closeModal.emit();
  }

  onQuestionTypeChange(value: unknown): void {
    const nextType = this.toQuestionType(value);
    this.questionType.set(nextType);

    if (nextType === QuestionType.Essay || nextType === QuestionType.TrueFalse) {
      this.correctOptionIndex.set(0);
      return;
    }

    this.mcqOptions.set(this.normalizeMcqOptions(this.mcqOptions()));
    const maxIndex = this.answerChoices().length - 1;
    this.correctOptionIndex.set(Math.max(0, Math.min(this.correctOptionIndex(), maxIndex)));
  }

  onMcqOptionChange(index: number, value: string): void {
    if (!this.isMcq()) {
      return;
    }

    this.mcqOptions.update((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  addOption(): void {
    if (!this.isMcq()) {
      return;
    }

    this.mcqOptions.update((current) => [...current, `Option ${current.length + 1}`]);
  }

  removeOption(index: number): void {
    if (!this.isMcq()) {
      return;
    }

    this.mcqOptions.update((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      return this.normalizeMcqOptions(next);
    });

    const normalized = this.answerChoices();
    const maxIndex = normalized.length - 1;
    this.correctOptionIndex.set(Math.max(0, Math.min(this.correctOptionIndex(), maxIndex)));
  }

  setCorrectOption(index: number): void {
    const choices = this.answerChoices();

    if (index < 0 || index >= choices.length) {
      return;
    }

    this.correctOptionIndex.set(index);
  }

  onSave(): void {
    if (!this.canSave()) {
      return;
    }

    const normalizedType = this.questionType();
    const options = this.answerChoices();
    const selectedCorrect = options[this.correctOptionIndex()] ?? '';

    const request: IQuestionRequest = {
      text: this.text().trim(),
      questionType: normalizedType,
      degree: this.normalizePositive(this.degree(), 1),
      courseId: this.courseId(),
      options: normalizedType === QuestionType.Essay ? [] : options,
      correctOptionText: normalizedType === QuestionType.Essay ? '' : selectedCorrect,
    };

    this.saveQuestion.emit({
      mode: this.mode(),
      id: this.mode() === 'edit' ? (this.question()?.id ?? null) : null,
      request,
    });
  }

  toPositiveNumber(value: unknown, fallback = 1): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.mediaFileName.set(file?.name ?? null);

    if (input) {
      input.value = '';
    }
  }

  private applyInitialState(): void {
    this.mediaFileName.set(null);

    const editQuestion = this.question();

    if (this.mode() === 'edit' && editQuestion) {
      this.text.set(editQuestion.text ?? '');
      this.questionType.set(this.toQuestionType(editQuestion.questionType));
      this.degree.set(this.normalizePositive(editQuestion.degree, 1));

      if (this.questionType() === QuestionType.Essay) {
        this.correctOptionIndex.set(0);
        return;
      }

      if (this.questionType() === QuestionType.TrueFalse) {
        this.correctOptionIndex.set(editQuestion.correctOptionText === 'False' ? 1 : 0);
        return;
      }

      const options = this.normalizeMcqOptions(editQuestion.options ?? []);
      this.mcqOptions.set(options);

      const correctAnswer = (editQuestion.correctOptionText ?? '').trim();
      const foundIndex = options.findIndex(
        (option) => option.toLowerCase() === correctAnswer.toLowerCase(),
      );

      this.correctOptionIndex.set(foundIndex >= 0 ? foundIndex : 0);
      return;
    }

    this.text.set('');
    this.questionType.set(QuestionType.MultipleChoice);
    this.degree.set(1);
    this.mcqOptions.set(['Option 1', 'Option 2']);
    this.correctOptionIndex.set(0);
  }

  private toQuestionType(value: unknown): QuestionType {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return QuestionType.MultipleChoice;
    }

    switch (numeric) {
      case QuestionType.MultipleChoice:
      case QuestionType.TrueFalse:
      case QuestionType.Essay:
        return numeric;
      default:
        return QuestionType.MultipleChoice;
    }
  }

  private normalizePositive(value: unknown, fallback: number): number {
    const numeric = Number(value);

    if (!Number.isFinite(numeric) || numeric <= 0) {
      return fallback;
    }

    return Math.floor(numeric);
  }

  private normalizeMcqOptions(options: string[]): string[] {
    const seen = new Set<string>();
    const normalized = options
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .filter((item) => {
        if (seen.has(item.toLowerCase())) {
          return false;
        }

        seen.add(item.toLowerCase());
        return true;
      });

    if (normalized.length >= 2) {
      return normalized;
    }

    const next = [...normalized];

    while (next.length < 2) {
      next.push(`Option ${next.length + 1}`);
    }

    return next;
  }
}
