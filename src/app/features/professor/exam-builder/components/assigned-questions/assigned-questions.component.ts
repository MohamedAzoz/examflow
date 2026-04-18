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
import { IExamQuestions } from '../../../../../data/models/ExamQuestions/iexam-questions';
import {
  ExamBuilderFacade,
  ExamBuilderCreateQuestionData,
} from '../../../services/exam-builder.facade';
import {
  QuestionEditorComponent,
  QuestionEditorDisplayMode,
  QuestionEditorInitialValue,
  QuestionEditorMode,
  QuestionEditorSavedEvent,
} from '../question-editor/question-editor.component';

interface EditableAssignedQuestion {
  id: number;
  text: string;
  imagePath: string;
  imagePreviewUrl: string | null;
  questionType: number;
  degree: number;
  courseId: number;
  optionsText: string;
  options: string[];
  correctOptionText: string;
}

@Component({
  selector: 'app-assigned-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, QuestionEditorComponent],
  templateUrl: './assigned-questions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignedQuestionsComponent {
  private static readonly DEFAULT_DEGREE = 1;
  private static readonly TRUE_FALSE_OPTIONS = ['True', 'False'];

  private readonly appMessageService = inject(AppMessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly examBuilderFacade = inject(ExamBuilderFacade);

  readonly assignedQuestions = input<readonly IExamQuestions[]>([]);
  readonly courseId = input<number | null>(null);
  readonly openCreateRequestTick = input<number>(0);

  readonly questionsChange = output<IExamQuestions[]>();

  readonly editableQuestions = signal<EditableAssignedQuestion[]>([]);
  readonly uploadingQuestionId = signal<number | null>(null);
  readonly dragSourceId = signal<number | null>(null);
  readonly dragTargetId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly isQuestionEditorOpen = signal(false);
  readonly questionEditorMode = signal<QuestionEditorMode>('create');
  readonly questionEditorDisplayMode = signal<QuestionEditorDisplayMode>('modal');
  readonly editorInitialQuestion = signal<QuestionEditorInitialValue | null>(null);

  readonly hasAssignedQuestions = computed(() => this.editableQuestions().length > 0);

  private readonly objectUrlPool = new Set<string>();
  private readonly handledCreateTick = signal(0);

  constructor() {
    effect(
      () => {
        const incoming = this.assignedQuestions();
        this.resetEditableQuestions(incoming);
      }
    );

    effect(
      () => {
        const tick = this.openCreateRequestTick();
        if (tick <= 0 || tick === this.handledCreateTick()) {
          return;
        }

        this.handledCreateTick.set(tick);
        this.openCreateEditor();
      }
    );

    this.destroyRef.onDestroy(() => {
      this.revokeAllObjectUrls();
    });
  }

  onCreateNewQuestion(): void {
    this.openCreateEditor();
  }

  onEditQuestion(questionId: number): void {
    const question = this.editableQuestions().find((item) => item.id === questionId);
    if (!question) {
      return;
    }

    this.questionEditorMode.set('edit');
    this.questionEditorDisplayMode.set('side-panel');
    this.editorInitialQuestion.set({
      id: question.id,
      text: question.text,
      questionType: question.questionType as QuestionType,
      degree: question.degree,
      options: this.resolveOptions(question.questionType, question.optionsText, question.options),
      correctOptionText: question.correctOptionText,
      imagePath: question.imagePath,
    });
    this.isQuestionEditorOpen.set(true);
  }

  onQuestionEditorClosed(): void {
    this.isQuestionEditorOpen.set(false);
    this.editorInitialQuestion.set(null);
  }

  onQuestionEditorSaved(event: QuestionEditorSavedEvent): void {
    if (event.mode === 'create') {
      const createdQuestion = this.mapSavedEventToEditableQuestion(event);

      this.editableQuestions.update((questions) => {
        const exists = questions.some((question) => question.id === createdQuestion.id);
        return exists ? questions : [createdQuestion, ...questions];
      });

      this.emitQuestionsChange();
      this.onQuestionEditorClosed();
      return;
    }

    if (!event.id) {
      this.onQuestionEditorClosed();
      return;
    }

    this.patchQuestion(event.id, (question) => ({
      ...question,
      text: event.text,
      questionType: event.questionType,
      degree: this.normalizeDegree(event.degree),
      optionsText: event.options.join(' | '),
      options: event.options,
      correctOptionText: event.correctOptionText,
      imagePath: event.imagePath ?? question.imagePath,
      imagePreviewUrl: event.imagePath ?? question.imagePreviewUrl,
    }));

    this.onQuestionEditorClosed();
  }

  trackByQuestionId(_: number, question: EditableAssignedQuestion): number {
    return question.id;
  }

  questionTypeLabel(questionType: number): string {
    switch (questionType) {
      case QuestionType.MultipleChoice:
        return 'MCQ';
      case QuestionType.TrueFalse:
        return 'True / False';
      case QuestionType.Essay:
        return 'Essay';
      default:
        return 'Other';
    }
  }

  isMcq(question: EditableAssignedQuestion): boolean {
    return question.questionType === QuestionType.MultipleChoice;
  }

  isEssay(question: EditableAssignedQuestion): boolean {
    return question.questionType === QuestionType.Essay;
  }

  isTrueFalse(question: EditableAssignedQuestion): boolean {
    return question.questionType === QuestionType.TrueFalse;
  }

  onQuestionTypeChange(questionId: number, value: number | string): void {
    const parsed = Number(value);
    const normalizedType = Number.isFinite(parsed)
      ? (parsed as QuestionType)
      : QuestionType.MultipleChoice;

    this.patchQuestion(questionId, (question) => {
      if (normalizedType === QuestionType.Essay) {
        return {
          ...question,
          questionType: normalizedType,
          optionsText: '',
          options: [],
          correctOptionText: '',
        };
      }

      if (normalizedType === QuestionType.TrueFalse) {
        return {
          ...question,
          questionType: normalizedType,
          optionsText: 'True | False',
          options: [...AssignedQuestionsComponent.TRUE_FALSE_OPTIONS],
          correctOptionText:
            question.correctOptionText === 'False'
              ? 'False'
              : AssignedQuestionsComponent.TRUE_FALSE_OPTIONS[0],
        };
      }

      const normalizedOptions = this.resolveOptions(
        QuestionType.MultipleChoice,
        question.optionsText,
        question.options,
      );

      return {
        ...question,
        questionType: QuestionType.MultipleChoice,
        optionsText: normalizedOptions.join(' | '),
        options: normalizedOptions,
        correctOptionText: normalizedOptions.includes(question.correctOptionText)
          ? question.correctOptionText
          : (normalizedOptions[0] ?? ''),
      };
    });
  }

  onQuestionTextChange(questionId: number, value: string): void {
    this.patchQuestion(questionId, (question) => ({
      ...question,
      text: value,
    }));
  }

  onOptionsTextChange(questionId: number, value: string): void {
    this.patchQuestion(questionId, (question) => {
      const options = this.resolveOptions(question.questionType, value, question.options);
      const correct = options.includes(question.correctOptionText)
        ? question.correctOptionText
        : (options[0] ?? '');

      return {
        ...question,
        optionsText: value,
        options,
        correctOptionText: correct,
      };
    });
  }

  onCorrectAnswerChange(questionId: number, value: string): void {
    this.patchQuestion(questionId, (question) => ({
      ...question,
      correctOptionText: value,
    }));
  }

  selectCorrectOption(questionId: number, option: string): void {
    this.patchQuestion(questionId, (question) => ({
      ...question,
      correctOptionText: option,
    }));
  }

  isCorrectOption(question: EditableAssignedQuestion, option: string): boolean {
    return question.correctOptionText.trim() === option.trim();
  }

  getOptionCandidates(question: EditableAssignedQuestion): string[] {
    return this.resolveOptions(question.questionType, question.optionsText, question.options);
  }

  onPointsChange(questionId: number, value: string | number): void {
    const nextValue = this.normalizeDegree(value);

    this.patchQuestion(questionId, (question) => ({
      ...question,
      degree: nextValue,
    }));
  }

  onImageSelected(event: Event, questionId: number): void {
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

    const localPreviewUrl = URL.createObjectURL(file);
    this.objectUrlPool.add(localPreviewUrl);

    this.patchQuestion(questionId, (question) => ({
      ...question,
      imagePath: localPreviewUrl,
      imagePreviewUrl: localPreviewUrl,
    }));

    this.uploadingQuestionId.set(questionId);
    this.errorMessage.set(null);

    this.examBuilderFacade.setCourseId(selectedCourseId);
    this.examBuilderFacade
      .uploadQuestionMedia(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.uploadingQuestionId() === questionId) {
            this.uploadingQuestionId.set(null);
          }
        }),
      )
      .subscribe({
        next: (uploadedPath) => {
          if (uploadedPath) {
            this.patchQuestion(questionId, (question) => ({
              ...question,
              imagePath: uploadedPath,
              imagePreviewUrl: uploadedPath,
            }));

            this.revokeObjectUrl(localPreviewUrl);
          }

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

  applyBold(questionId: number, textarea: HTMLTextAreaElement): void {
    this.applyInlineFormatting(questionId, textarea, '**', '**');
  }

  applyUnderline(questionId: number, textarea: HTMLTextAreaElement): void {
    this.applyInlineFormatting(questionId, textarea, '<u>', '</u>');
  }

  onDragStart(questionId: number): void {
    this.dragSourceId.set(questionId);
  }

  onDragOver(event: DragEvent, questionId: number): void {
    event.preventDefault();

    const sourceId = this.dragSourceId();
    if (!sourceId || sourceId === questionId) {
      return;
    }

    this.dragTargetId.set(questionId);
  }

  onDrop(event: DragEvent, questionId: number): void {
    event.preventDefault();

    const sourceId = this.dragSourceId();
    if (!sourceId || sourceId === questionId) {
      this.clearDragState();
      return;
    }

    const reordered = this.reorderQuestions(sourceId, questionId);
    if (!reordered) {
      this.clearDragState();
      return;
    }

    this.editableQuestions.set(reordered);
    this.emitQuestionsChange();
    this.clearDragState();
  }

  onDragEnd(): void {
    this.clearDragState();
  }

  private openCreateEditor(): void {
    this.questionEditorMode.set('create');
    this.questionEditorDisplayMode.set('modal');
    this.editorInitialQuestion.set(null);
    this.isQuestionEditorOpen.set(true);
  }

  private clearDragState(): void {
    this.dragSourceId.set(null);
    this.dragTargetId.set(null);
  }

  private patchQuestion(
    questionId: number,
    updater: (question: EditableAssignedQuestion) => EditableAssignedQuestion,
  ): void {
    this.editableQuestions.update((questions) =>
      questions.map((question) => (question.id === questionId ? updater(question) : question)),
    );

    this.emitQuestionsChange();
  }

  private emitQuestionsChange(): void {
    this.questionsChange.emit(
      this.editableQuestions().map((question) => this.toOutputQuestion(question)),
    );
  }

  private reorderQuestions(sourceId: number, targetId: number): EditableAssignedQuestion[] | null {
    const current = this.editableQuestions();
    const sourceIndex = current.findIndex((question) => question.id === sourceId);
    const targetIndex = current.findIndex((question) => question.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return null;
    }

    const reordered = [...current];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    return reordered;
  }

  private resetEditableQuestions(source: readonly IExamQuestions[]): void {
    this.revokeAllObjectUrls();

    const mapped = source.map((question) => this.toEditableQuestion(question));
    this.editableQuestions.set(mapped);
    this.errorMessage.set(null);
  }

  private toEditableQuestion(question: IExamQuestions): EditableAssignedQuestion {
    return {
      id: question.id,
      text: question.text,
      imagePath: question.imagePath,
      imagePreviewUrl: question.imagePath || null,
      questionType: question.questionType,
      degree: this.normalizeDegree(question.degree),
      courseId: question.courseId,
      optionsText: (question.options ?? []).join(' | '),
      options: question.options ?? [],
      correctOptionText: question.correctOptionText ?? '',
    };
  }

  private mapSavedEventToEditableQuestion(
    event: QuestionEditorSavedEvent,
  ): EditableAssignedQuestion {
    const selectedCourseId = this.courseId();
    const normalizedCourseId = selectedCourseId && selectedCourseId > 0 ? selectedCourseId : 0;

    const normalizedOptions = this.resolveOptions(
      event.questionType,
      event.options.join(' | '),
      event.options,
    );

    const id = event.id && event.id > 0 ? event.id : Date.now();

    return {
      id,
      text: event.text,
      imagePath: event.imagePath ?? '',
      imagePreviewUrl: event.imagePath ?? null,
      questionType: event.questionType,
      degree: this.normalizeDegree(event.degree),
      courseId: normalizedCourseId,
      optionsText: normalizedOptions.join(' | '),
      options: normalizedOptions,
      correctOptionText: event.correctOptionText,
    };
  }

  private toOutputQuestion(question: EditableAssignedQuestion): IExamQuestions {
    const normalizedText = question.text.trim();
    const normalizedOptions = this.resolveOptions(
      question.questionType,
      question.optionsText,
      question.options,
    );
    const normalizedCorrectAnswer = this.resolveCorrectAnswer(
      question.questionType,
      question.correctOptionText,
      normalizedOptions,
    );

    const selectedCourseId = this.courseId();
    const normalizedCourseId =
      Number.isFinite(question.courseId) && question.courseId > 0
        ? question.courseId
        : selectedCourseId && selectedCourseId > 0
          ? selectedCourseId
          : 0;

    return {
      id: question.id,
      text: normalizedText,
      imagePath: question.imagePath,
      questionType: question.questionType,
      degree: this.normalizeDegree(question.degree),
      courseId: normalizedCourseId,
      options: normalizedOptions,
      correctOptionText: normalizedCorrectAnswer,
    };
  }

  private applyInlineFormatting(
    questionId: number,
    textarea: HTMLTextAreaElement,
    prefix: string,
    suffix: string,
  ): void {
    const value = textarea.value ?? '';
    const selectionStart = textarea.selectionStart ?? value.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;

    const selectedText = value.slice(selectionStart, selectionEnd);
    const textToWrap = selectedText.length > 0 ? selectedText : 'text';

    const nextValue =
      value.slice(0, selectionStart) + prefix + textToWrap + suffix + value.slice(selectionEnd);

    this.patchQuestion(questionId, (question) => ({
      ...question,
      text: nextValue,
    }));

    queueMicrotask(() => {
      textarea.focus();
      const cursor = selectionStart + prefix.length + textToWrap.length + suffix.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  private normalizeOptions(optionsText: string): string[] {
    return optionsText
      .split('|')
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
  }

  private normalizeDegree(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return AssignedQuestionsComponent.DEFAULT_DEGREE;
    }

    return Math.floor(parsed);
  }

  private resolveOptions(
    questionType: number,
    optionsText: string,
    fallbackOptions: string[],
  ): string[] {
    if (questionType === QuestionType.Essay) {
      return [];
    }

    if (questionType === QuestionType.TrueFalse) {
      return [...AssignedQuestionsComponent.TRUE_FALSE_OPTIONS];
    }

    const normalized = this.normalizeOptions(optionsText);
    if (normalized.length > 0) {
      return normalized;
    }

    return fallbackOptions.length > 0 ? fallbackOptions : ['Option 1', 'Option 2'];
  }

  private resolveCorrectAnswer(
    questionType: number,
    candidate: string,
    normalizedOptions: string[],
  ): string {
    const trimmed = candidate.trim();

    if (questionType === QuestionType.Essay) {
      return '';
    }

    if (questionType === QuestionType.TrueFalse) {
      return trimmed === 'False' ? 'False' : 'True';
    }

    if (trimmed.length > 0 && normalizedOptions.includes(trimmed)) {
      return trimmed;
    }

    return normalizedOptions[0] ?? '';
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
