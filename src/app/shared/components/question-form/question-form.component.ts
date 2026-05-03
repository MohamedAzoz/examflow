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
  ViewChild,
  ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { AppMessageService } from '../../../core/services/app-message';
import { QuestionType } from '../../../data/enums/question-type';
import { IQuestionRequest } from '../../../data/models/question/iquestion-request';
import { Question } from '../../../data/services/question';
import { TextFormattingService } from '../../../features/professor/services/text-formatting.service';
import { environment } from '../../../../environments/environment';

export type QuestionFormMode = 'create' | 'edit';
export type QuestionFormDisplayMode = 'modal' | 'side-panel';

export interface QuestionFormInitialValue {
  id?: number | null;
  text?: string;
  questionType?: QuestionType;
  degree?: number;
  options?: string[];
  correctOptionText?: string;
  imagePath?: string | null;
}

export interface QuestionFormSavePayload {
  mode: QuestionFormMode;
  id: number | null;
  request: IQuestionRequest;
}

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionFormComponent {
  private static readonly MIN_MCQ_OPTIONS = 2;
  private static readonly DEFAULT_POINTS = 1;

  private readonly questionService = inject(Question);
  private readonly appMessageService = inject(AppMessageService);
  private readonly textFormattingService = inject(TextFormattingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly String = String;

  @ViewChild('questionStemEditor') editor!: ElementRef<HTMLDivElement>;

  readonly visible = input(false);
  readonly mode = input<QuestionFormMode>('create');
  // readonly displayMode = input<QuestionFormDisplayMode>('modal');
  readonly courseId = input<number>(0);
  readonly saving = input(false);
  readonly header = input('Create Question');
  readonly initialQuestion = input<QuestionFormInitialValue | null>(null);

  readonly closeModal = output<void>();
  readonly saveQuestion = output<QuestionFormSavePayload>();

  readonly text = signal('');
  readonly questionType = signal<QuestionType>(QuestionType.MultipleChoice);
  readonly degree = signal(QuestionFormComponent.DEFAULT_POINTS);
  readonly mcqOptions = signal<string[]>(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
  readonly correctOptionIndex = signal(0);

  readonly mediaFile = signal<File | null>(null);
  readonly imagePath = signal<string | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);

  readonly isUploading = signal(false);
  readonly errorMessage = signal<string | null>(null);

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

  readonly panelTitle = computed(() => {
    const defaultAction =
      this.mode() === 'edit' ? 'Update Question Details' : 'Create New Question';
    return this.header().trim().length > 0 && this.header() !== 'Question Editor'
      ? this.header().trim()
      : defaultAction;
  });

  readonly saveLabel = computed(() =>
    this.mode() === 'edit' ? 'Save Changes' : 'Create Question',
  );

  readonly hasPendingImageUpload = computed(() => {
    return this.mediaFile() !== null && this.imagePath() === null;
  });

  readonly canSave = computed(() => {
    if (this.saving() || this.isUploading()) {
      return false;
    }

    if (this.hasPendingImageUpload()) {
      return false;
    }

    if (this.courseId() <= 0) {
      return false;
    }

    if (this.text().trim().length === 0 || this.degree() <= 0) {
      return false;
    }

    if (this.isEssay()) {
      return true;
    }

    const choices = this.answerChoices();
    const currentIndex = this.correctOptionIndex();

    return choices.length > 0 && currentIndex >= 0 && currentIndex < choices.length;
  });

  private readonly objectUrlPool = new Set<string>();

  constructor() {
    effect(() => {
      const currentText = this.text();
      if (this.editor) {
        const el = this.editor.nativeElement;
        if (el.innerHTML !== currentText) {
          el.innerHTML = currentText;
        }
      }
    });

    effect(() => {
      if (!this.visible()) {
        return;
      }
      this.applyInitialState(this.mode(), this.initialQuestion());
    });

    this.destroyRef.onDestroy(() => {
      this.revokeAllObjectUrls();
    });
  }

  onBackdropClick(event: MouseEvent): void {
    // if (this.displayMode() !== 'modal') {
    //   return;
    // }
    if (event.target !== event.currentTarget) {
      return;
    }
    this.onClose();
  }

  onClose(): void {
    if (this.saving() || this.isUploading()) {
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
    if (!this.isMcq()) return;
    this.mcqOptions.update((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  addOption(): void {
    if (!this.isMcq()) return;
    this.mcqOptions.update((current) => [...current, `Option ${current.length + 1}`]);
  }

  removeOption(index: number): void {
    if (!this.isMcq()) return;
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
    if (index < 0 || index >= choices.length) return;
    this.correctOptionIndex.set(index);
  }

  onImageSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement | null;
    const file = inputElement?.files?.[0];
    if (!file) return;

    const localPreviewUrl = URL.createObjectURL(file);
    this.objectUrlPool.add(localPreviewUrl);

    this.mediaFile.set(file);
    this.imagePath.set(null); // Clear previous path since we have a new unuploaded file
    this.imagePreviewUrl.set(localPreviewUrl);
    this.errorMessage.set(null);

    if (inputElement) {
      inputElement.value = '';
    }
  }

  uploadSelectedImage(): void {
    const file = this.mediaFile();
    const courseId = this.courseId();

    if (!file || courseId <= 0) {
      this.errorMessage.set('Course ID is required or no file selected.');
      return;
    }

    this.isUploading.set(true);
    this.errorMessage.set(null);

    this.questionService
      .uploadMediaQuestions({ file, courseId })
      .pipe(
        map(
          (response: any) =>
            response?.imagePath ||
            (response as any)?.result?.imagePath ||
            (typeof response === 'string' ? response : null),
        ),
        catchError((error: HttpErrorResponse) => {
          const msg = this.appMessageService.showHttpError(
            error,
            'Failed to upload question image.',
          );
          this.errorMessage.set(msg);
          return throwError(() => error);
        }),
        finalize(() => this.isUploading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (uploadedPath) => {
          if (!uploadedPath) {
            this.errorMessage.set('Image uploaded, but the API did not return a valid path.');
            return;
          }

          this.imagePath.set(uploadedPath);
          this.appMessageService.addSuccessMessage('Image uploaded successfully.');
        },
      });
  }

  deleteSelectedImage(): void {
    this.mediaFile.set(null);
    this.imagePath.set(null);
    this.imagePreviewUrl.set(null);
    this.errorMessage.set(null);
  }

  onStemInput(event: Event): void {
    const el = event.target as HTMLElement;
    this.text.set(el.innerHTML);
  }
  onInput(event: any) {
    this.text.set(event.target.innerHTML);
  }
  applyBoldToStem(): void {
    this.textFormattingService.applyBold();
    this.syncText();
  }

  applyItalicToStem(): void {
    this.textFormattingService.applyItalic();
    this.syncText();
  }

  applyUnderlineToStem(): void {
    this.textFormattingService.applyUnderline();
    this.syncText();
  }

  deleteSelectedText(): void {
    this.textFormattingService.deleteSelected();
    this.syncText();
  }

  clearAllText(): void {
    if (this.editor) {
      this.textFormattingService.clearAll(this.editor.nativeElement);
      this.syncText();
    }
  }

  // applyListToStem(): void {
  //   this.textFormattingService.applyList();
  //   this.syncText();
  // }

  // دالة لتحديث الـ Signal بعد الضغط على الأزرار
  private syncText() {
    if (this.editor) {
      this.text.set(this.editor.nativeElement.innerHTML);
    }
  }

  onSave(): void {
    if (!this.canSave()) {
      if (this.hasPendingImageUpload()) {
        this.errorMessage.set('Please click upload to send the image before saving.');
      }
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
      imagePath: this.imagePath() ?? '',
    };

    this.saveQuestion.emit({
      mode: this.mode(),
      id: this.mode() === 'edit' ? (this.initialQuestion()?.id ?? null) : null,
      request,
    });
  }

  toPositiveNumber(value: unknown, fallback = 1): number {
    return this.normalizePositive(value, fallback);
  }

  private applyInitialState(
    mode: QuestionFormMode,
    incoming: QuestionFormInitialValue | null,
  ): void {
    if (mode === 'edit' && incoming) {
      this.text.set(incoming.text ?? '');
      this.questionType.set(this.toQuestionType(incoming.questionType));
      this.degree.set(this.normalizePositive(incoming.degree, 1));

      this.imagePath.set(incoming.imagePath ?? null);

      let previewUrl = incoming.imagePath ?? null;
      if (
        previewUrl &&
        !previewUrl.startsWith('http') &&
        !previewUrl.startsWith('blob:') &&
        !previewUrl.startsWith('data:')
      ) {
        const baseUrl = environment.baseUrl.replace(/\/$/, '');
        previewUrl = previewUrl.startsWith('/')
          ? `${baseUrl}${previewUrl}`
          : `${baseUrl}/${previewUrl}`;
      }
      this.imagePreviewUrl.set(previewUrl);
      this.mediaFile.set(null);

      if (this.questionType() === QuestionType.Essay) {
        this.correctOptionIndex.set(0);
        return;
      }

      if (this.questionType() === QuestionType.TrueFalse) {
        this.correctOptionIndex.set(incoming.correctOptionText === 'False' ? 1 : 0);
        return;
      }

      const options = this.normalizeMcqOptions(incoming.options ?? []);
      this.mcqOptions.set(options);

      const correctAnswer = (incoming.correctOptionText ?? '').trim();
      const foundIndex = options.findIndex(
        (option) => option.toLowerCase() === correctAnswer.toLowerCase(),
      );

      this.correctOptionIndex.set(foundIndex >= 0 ? foundIndex : 0);
      return;
    }

    this.text.set('');
    this.questionType.set(QuestionType.MultipleChoice);
    this.degree.set(1);
    this.mcqOptions.set(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
    this.correctOptionIndex.set(0);
    this.imagePath.set(null);
    this.imagePreviewUrl.set(null);
    this.mediaFile.set(null);
    this.errorMessage.set(null);
  }

  private toQuestionType(value: unknown): QuestionType {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return QuestionType.MultipleChoice;
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
    if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
    return Math.floor(numeric);
  }

  private normalizeMcqOptions(options: string[]): string[] {
    const seen = new Set<string>();
    const normalized = options
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .filter((item) => {
        if (seen.has(item.toLowerCase())) return false;
        seen.add(item.toLowerCase());
        return true;
      });

    if (normalized.length >= 4) return normalized;
    const next = [...normalized];
    while (next.length < 4) {
      next.push(`Option ${next.length + 1}`);
    }
    return next;
  }

  private revokeAllObjectUrls(): void {
    for (const url of this.objectUrlPool) {
      URL.revokeObjectURL(url);
    }
    this.objectUrlPool.clear();
  }
}
