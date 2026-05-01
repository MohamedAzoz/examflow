import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AppMessageService } from '../../../../../core/services/app-message';
import { QuestionType } from '../../../../../data/enums/question-type';
import { IQuestionRequest } from '../../../../../data/models/question/iquestion-request';
import {
  ExamBuilderFacade,
  ExamBuilderUpdateQuestionData,
} from '../../../services/exam-builder.facade';

export type QuestionEditorDisplayMode = 'modal' | 'side-panel';
export type QuestionEditorMode = 'create' | 'edit';

export interface QuestionEditorInitialValue {
  id?: number;
  text: string;
  questionType: QuestionType;
  degree: number;
  options: string[];
  correctOptionText: string;
  imagePath?: string | null;
}

export interface QuestionEditorSavedEvent {
  mode: QuestionEditorMode;
  id: number | null;
  text: string;
  questionType: QuestionType;
  degree: number;
  options: string[];
  correctOptionText: string;
  imagePath: string | null;
  response: unknown;
}

@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEditorComponent {
  private static readonly MIN_MCQ_OPTIONS = 2;
  private static readonly DEFAULT_POINTS = 1;

  private readonly examBuilderFacade = inject(ExamBuilderFacade);
  private readonly appMessageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = input(false);
  readonly mode = input<QuestionEditorMode>('create');
  readonly displayMode = input<QuestionEditorDisplayMode>('modal');
  readonly courseId = input<number | null>(null);
  readonly header = input('Question Editor');
  readonly initialQuestion = input<QuestionEditorInitialValue | null>(null);

  readonly closed = output<void>();
  readonly saved = output<QuestionEditorSavedEvent>();

  readonly text = signal('');
  readonly questionType = signal<QuestionType>(QuestionType.MultipleChoice);
  readonly points = signal(QuestionEditorComponent.DEFAULT_POINTS);
  readonly optionsText = signal('Option 1 | Option 2');
  readonly correctOptionText = signal('Option 1');
  readonly imagePath = signal<string | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);

  readonly isSaving = signal(false);
  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly isMcq = computed(() => this.questionType() === QuestionType.MultipleChoice);
  readonly isTrueFalse = computed(() => this.questionType() === QuestionType.TrueFalse);
  readonly isEssay = computed(() => this.questionType() === QuestionType.Essay);

  readonly normalizedOptions = computed(() => this.resolveOptions());
  readonly correctAnswerCandidates = computed(() => {
    if (this.isEssay()) {
      return [];
    }

    if (this.isTrueFalse()) {
      return ['True', 'False'];
    }

    return this.normalizedOptions();
  });

  readonly panelTitle = computed(() => {
    const defaultAction = this.mode() === 'edit' ? 'Edit Question' : 'Create Question';
    return this.header().trim().length > 0 ? this.header().trim() : defaultAction;
  });

  readonly saveLabel = computed(() => (this.mode() === 'edit' ? 'Save Changes' : 'Save Question'));

  readonly canSave = computed(() => {
    if (this.isSaving() || this.isUploading()) {
      return false;
    }

    const selectedCourseId = this.courseId();
    if (!selectedCourseId || selectedCourseId <= 0) {
      return false;
    }

    if (this.text().trim().length === 0 || this.points() <= 0) {
      return false;
    }

    if (this.isEssay()) {
      return true;
    }

    const candidates = this.correctAnswerCandidates();
    if (candidates.length === 0) {
      return false;
    }

    const selectedCorrect = this.correctOptionText().trim();
    return candidates.includes(selectedCorrect);
  });

  private readonly objectUrlPool = new Set<string>();

  constructor() {
    effect(
      () => {
        if (!this.open()) {
          return;
        }

        this.applyInitialState(this.mode(), this.initialQuestion());
      }
    );

    effect(
      () => {
        const currentType = this.questionType();

        if (currentType === QuestionType.Essay) {
          this.optionsText.set('');
          this.correctOptionText.set('');
          return;
        }

        if (currentType === QuestionType.TrueFalse) {
          this.optionsText.set('True | False');
          const currentCorrect = this.correctOptionText().trim();
          this.correctOptionText.set(currentCorrect === 'False' ? 'False' : 'True');
          return;
        }

        const options = this.resolveOptions();
        if (options.length < QuestionEditorComponent.MIN_MCQ_OPTIONS) {
          const padded = this.padMcqOptions(options);
          this.optionsText.set(padded.join(' | '));
        }

        const currentCorrect = this.correctOptionText().trim();
        const normalized = this.resolveOptions();
        if (!normalized.includes(currentCorrect)) {
          this.correctOptionText.set(normalized[0] ?? '');
        }
      }
    );

    this.destroyRef.onDestroy(() => {
      this.revokeAllObjectUrls();
    });
  }

  onClose(): void {
    if (this.isSaving() || this.isUploading()) {
      return;
    }

    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.displayMode() !== 'modal') {
      return;
    }

    if (event.target !== event.currentTarget) {
      return;
    }

    this.onClose();
  }

  onQuestionTypeChange(value: QuestionType | string | number): void {
    const parsed = typeof value === 'number' ? value : Number(value);
    const normalized = Number.isFinite(parsed)
      ? (parsed as QuestionType)
      : QuestionType.MultipleChoice;
    this.questionType.set(normalized);
  }

  onPointsChange(value: string | number): void {
    this.points.set(this.normalizePoints(value));
  }

  onOptionsInputChange(value: string): void {
    this.optionsText.set(value);

    const options = this.resolveOptions();
    const currentCorrect = this.correctOptionText().trim();
    if (options.length > 0 && !options.includes(currentCorrect)) {
      this.correctOptionText.set(options[0]);
    }
  }

  addMcqOption(): void {
    if (!this.isMcq()) {
      return;
    }

    const options = this.resolveOptions();
    const nextLabel = `Option ${options.length + 1}`;
    const next = [...options, nextLabel];

    this.optionsText.set(next.join(' | '));

    if (this.correctOptionText().trim().length === 0) {
      this.correctOptionText.set(nextLabel);
    }
  }

  removeMcqOption(optionToRemove: string): void {
    if (!this.isMcq()) {
      return;
    }

    const options = this.resolveOptions();
    const indexToRemove = options.findIndex((option) => option === optionToRemove);
    if (indexToRemove < 0) {
      return;
    }

    const next = [...options];
    next.splice(indexToRemove, 1);

    const padded = this.padMcqOptions(next);
    this.optionsText.set(padded.join(' | '));

    const currentCorrect = this.correctOptionText().trim();
    if (!padded.includes(currentCorrect)) {
      this.correctOptionText.set(padded[0] ?? '');
    }
  }

  onCorrectAnswerChange(value: string): void {
    this.correctOptionText.set(value);
  }

  onImageSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement | null;
    const file = inputElement?.files?.[0];
    if (!file) {
      return;
    }

    const selectedCourseId = this.courseId();
    if (!selectedCourseId || selectedCourseId <= 0) {
      this.errorMessage.set('Course id is required before uploading question media.');
      if (inputElement) {
        inputElement.value = '';
      }
      return;
    }

    this.errorMessage.set(null);
    this.isUploading.set(true);

    const localPreviewUrl = URL.createObjectURL(file);
    this.objectUrlPool.add(localPreviewUrl);

    this.imagePreviewUrl.set(localPreviewUrl);

    this.examBuilderFacade.setCourseId(selectedCourseId);
    this.examBuilderFacade
      .uploadQuestionMedia(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isUploading.set(false)),
      )
      .subscribe({
        next: (uploadedPath) => {
          if (!uploadedPath) {
            this.errorMessage.set('Image uploaded, but the API did not return a valid path.');
            return;
          }

          this.imagePath.set(uploadedPath);
          this.imagePreviewUrl.set(uploadedPath);
          this.revokeObjectUrl(localPreviewUrl);
          this.appMessageService.addSuccessMessage('Question image uploaded successfully.');
        },
        error: (error) => {
          this.errorMessage.set(
            this.appMessageService.showHttpError(error, 'Failed to upload question image.'),
          );
        },
      });

    if (inputElement) {
      inputElement.value = '';
    }
  }


  onSaveQuestion(): void {
    if (!this.canSave()) {
      return;
    }

    const selectedCourseId = this.courseId();
    if (!selectedCourseId || selectedCourseId <= 0) {
      this.errorMessage.set('Course id is required before saving question.');
      return;
    }

    this.examBuilderFacade.setCourseId(selectedCourseId);

    const options = this.resolveOptions();
    const payload = this.buildSavePayload(selectedCourseId, options);

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const request$ =
      this.mode() === 'edit' && this.initialQuestion()?.id
        ? this.examBuilderFacade.updateQuestion(this.initialQuestion()!.id!, payload.updatePayload)
        : this.examBuilderFacade.createQuestion(payload.createPayload);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (response) => {
          const id =
            this.mode() === 'edit'
              ? (this.initialQuestion()?.id ?? null)
              : this.extractEntityId(response);

          this.saved.emit({
            mode: this.mode(),
            id,
            text: payload.normalizedText,
            questionType: payload.normalizedType,
            degree: payload.normalizedPoints,
            options: payload.normalizedOptions,
            correctOptionText: payload.normalizedCorrectAnswer,
            imagePath: this.imagePath(),
            response,
          });

          this.appMessageService.addSuccessMessage(
            this.mode() === 'edit'
              ? 'Question updated successfully.'
              : 'Question created successfully.',
          );

          this.onClose();
        },
        error: (error) => {
          this.errorMessage.set(
            this.appMessageService.showHttpError(error, 'Failed to save question.'),
          );
        },
      });
  }

  private applyInitialState(
    mode: QuestionEditorMode,
    incoming: QuestionEditorInitialValue | null,
  ): void {
    if (mode === 'edit' && incoming) {
      const options =
        incoming.questionType === QuestionType.MultipleChoice
          ? this.padMcqOptions(incoming.options ?? [])
          : incoming.questionType === QuestionType.TrueFalse
            ? ['True', 'False']
            : [];

      this.text.set(incoming.text ?? '');
      this.questionType.set(incoming.questionType ?? QuestionType.MultipleChoice);
      this.points.set(this.normalizePoints(incoming.degree));
      this.optionsText.set(options.join(' | '));
      this.correctOptionText.set(incoming.correctOptionText ?? options[0] ?? '');
      this.imagePath.set(incoming.imagePath ?? null);
      this.imagePreviewUrl.set(incoming.imagePath ?? null);
      this.errorMessage.set(null);
      return;
    }

    this.text.set('');
    this.questionType.set(QuestionType.MultipleChoice);
    this.points.set(QuestionEditorComponent.DEFAULT_POINTS);
    this.optionsText.set('Option 1 | Option 2');
    this.correctOptionText.set('Option 1');
    this.imagePath.set(null);
    this.imagePreviewUrl.set(null);
    this.errorMessage.set(null);
  }

  private buildSavePayload(
    courseId: number,
    resolvedOptions: string[],
  ): {
    createPayload: IQuestionRequest;
    updatePayload: ExamBuilderUpdateQuestionData;
    normalizedText: string;
    normalizedType: QuestionType;
    normalizedPoints: number;
    normalizedOptions: string[];
    normalizedCorrectAnswer: string;
  } {
    const normalizedText = this.text().trim();
    const normalizedType = this.questionType();
    const normalizedPoints = this.normalizePoints(this.points());
    const normalizedOptions = resolvedOptions;
    const normalizedCorrectAnswer = this.resolveCorrectAnswer(normalizedOptions);

    const createPayload: IQuestionRequest = {
      text: normalizedText,
      questionType: normalizedType,
      degree: normalizedPoints,
      courseId,
      options: normalizedOptions,
      correctOptionText: normalizedCorrectAnswer,
      imagePath: this.imagePath() ?? '',
    };

    const updatePayload: ExamBuilderUpdateQuestionData = {
      text: normalizedText,
      questionType: normalizedType,
      degree: normalizedPoints,
      options: normalizedOptions,
      correctOptionText: normalizedCorrectAnswer,
      imagePath: this.imagePath() ?? '',
      courseId,
    };

    return {
      createPayload,
      updatePayload,
      normalizedText,
      normalizedType,
      normalizedPoints,
      normalizedOptions,
      normalizedCorrectAnswer,
    };
  }

  private resolveOptions(): string[] {
    if (this.isEssay()) {
      return [];
    }

    if (this.isTrueFalse()) {
      return ['True', 'False'];
    }

    const parsed = this.optionsText()
      .split('|')
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    return this.padMcqOptions(parsed);
  }

  private padMcqOptions(options: string[]): string[] {
    if (options.length >= QuestionEditorComponent.MIN_MCQ_OPTIONS) {
      return options;
    }

    const padded = [...options];
    while (padded.length < QuestionEditorComponent.MIN_MCQ_OPTIONS) {
      padded.push(`Option ${padded.length + 1}`);
    }

    return padded;
  }

  private resolveCorrectAnswer(options: string[]): string {
    if (this.isEssay()) {
      return '';
    }

    if (this.isTrueFalse()) {
      return this.correctOptionText().trim() === 'False' ? 'False' : 'True';
    }

    const candidate = this.correctOptionText().trim();
    if (candidate.length > 0 && options.includes(candidate)) {
      return candidate;
    }

    return options[0] ?? '';
  }

  private normalizePoints(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return QuestionEditorComponent.DEFAULT_POINTS;
    }

    return Math.floor(parsed);
  }

  private extractEntityId(response: unknown): number | null {
    if (typeof response === 'number' && response > 0) {
      return response;
    }

    if (!response || typeof response !== 'object') {
      return null;
    }

    const payload = response as Record<string, unknown>;
    const candidates = [payload['id'], payload['questionId'], payload['result']];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && candidate > 0) {
        return candidate;
      }

      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const nested = candidate as Record<string, unknown>;
      const nestedCandidates = [nested['id'], nested['questionId']];

      for (const nestedCandidate of nestedCandidates) {
        if (typeof nestedCandidate === 'number' && nestedCandidate > 0) {
          return nestedCandidate;
        }
      }
    }

    return null;
  }

  private revokeObjectUrl(url: string): void {
    if (!this.objectUrlPool.has(url)) {
      return;
    }

    URL.revokeObjectURL(url);
    this.objectUrlPool.delete(url);
  }

  private revokeAllObjectUrls(): void {
    for (const url of this.objectUrlPool) {
      URL.revokeObjectURL(url);
    }

    this.objectUrlPool.clear();
  }
}
