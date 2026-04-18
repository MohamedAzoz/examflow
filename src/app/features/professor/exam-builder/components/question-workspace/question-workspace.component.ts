import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuestionType } from '../../../../../data/enums/question-type';
import { IExamQuestions } from '../../../../../data/models/ExamQuestions/iexam-questions';
import { IQuestionResponse } from '../../../../../data/models/question/iquestion-response';

export interface BuilderCreateQuestionPayload {
  text: string;
  questionType: number;
  degree: number;
  options: string[];
  correctOptionText: string;
  mediaFile: File | null;
}

export interface BuilderUpdateQuestionPayload {
  id: number;
  text: string;
  questionType: number;
  degree: number;
  options: string[];
  correctOptionText: string;
}

export interface SelectedQuestionDegreeChangePayload {
  id: number;
  degree: number;
}

interface EditableAssignedQuestion {
  id: number;
  text: string;
  questionType: number;
  degree: number;
  optionsText: string;
  correctOptionText: string;
  imagePath: string;
}

@Component({
  selector: 'app-question-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-workspace.component.html',
  styleUrl: './question-workspace.component.css',
})
export class QuestionWorkspaceComponent implements OnChanges {
  @Input() selectedQuestionsPreview: IQuestionResponse[] = [];
  @Input() selectedQuestionDegrees: Record<number, number> = {};
  @Input() assignedQuestions: IExamQuestions[] = [];
  @Input() createVisible = false;
  @Input() savingQuestion = false;

  @Output() closeCreate = new EventEmitter<void>();
  @Output() submitCreateQuestion = new EventEmitter<BuilderCreateQuestionPayload>();
  @Output() submitUpdateQuestion = new EventEmitter<BuilderUpdateQuestionPayload>();
  @Output() selectedQuestionDegreeChanged = new EventEmitter<SelectedQuestionDegreeChangePayload>();

  protected readonly QuestionType = QuestionType;
  protected createDraft = this.createDefaultDraft();
  protected editableAssignedQuestions: EditableAssignedQuestion[] = [];
  protected selectedMediaName = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assignedQuestions']) {
      this.editableAssignedQuestions = this.assignedQuestions.map((question) => ({
        id: question.id,
        text: question.text,
        questionType: question.questionType,
        degree: question.degree,
        optionsText: (question.options || []).join(' | '),
        correctOptionText: question.correctOptionText || '',
        imagePath: question.imagePath || '',
      }));
    }

    if (changes['createVisible'] && this.createVisible) {
      this.resetCreateDraft();
    }
  }

  protected onCreateTypeChange(value: string): void {
    const parsedType = Number(value);
    this.createDraft.questionType = Number.isFinite(parsedType)
      ? parsedType
      : QuestionType.MultipleChoice;

    if (this.createDraft.questionType === QuestionType.TrueFalse) {
      this.createDraft.options = ['True', 'False'];
      this.createDraft.correctOptionText = 'True';
      return;
    }

    if (this.createDraft.questionType === QuestionType.Essay) {
      this.createDraft.options = [];
      this.createDraft.correctOptionText = '';
      return;
    }

    if (this.createDraft.options.length < 2) {
      this.createDraft.options = ['', ''];
    }
  }

  protected setCreateOption(index: number, value: string): void {
    this.createDraft.options[index] = value;
  }

  protected addCreateOption(): void {
    this.createDraft.options.push('');
  }

  protected removeCreateOption(index: number): void {
    if (this.createDraft.options.length <= 2) {
      return;
    }

    this.createDraft.options.splice(index, 1);
  }

  protected onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;

    this.createDraft.mediaFile = file;
    this.selectedMediaName = file?.name || '';
  }

  protected submitCreate(): void {
    const cleanedText = this.createDraft.text.trim();
    if (!cleanedText) {
      return;
    }

    const cleanedDegree = Number(this.createDraft.degree);
    if (!Number.isFinite(cleanedDegree) || cleanedDegree <= 0) {
      return;
    }

    const normalized = this.normalizeCreatePayload();
    if (!normalized) {
      return;
    }

    this.submitCreateQuestion.emit({
      text: cleanedText,
      questionType: normalized.questionType,
      degree: cleanedDegree,
      options: normalized.options,
      correctOptionText: normalized.correctOptionText,
      mediaFile: this.createDraft.mediaFile,
    });
  }

  protected closeCreatePanel(): void {
    this.closeCreate.emit();
  }

  protected onAssignedTypeChange(question: EditableAssignedQuestion, value: string): void {
    const parsedType = Number(value);
    question.questionType = Number.isFinite(parsedType) ? parsedType : QuestionType.MultipleChoice;

    if (question.questionType === QuestionType.TrueFalse) {
      question.optionsText = 'True | False';
      if (question.correctOptionText !== 'True' && question.correctOptionText !== 'False') {
        question.correctOptionText = 'True';
      }
      return;
    }

    if (question.questionType === QuestionType.Essay) {
      question.optionsText = '';
      question.correctOptionText = '';
    }
  }

  protected saveAssignedQuestion(question: EditableAssignedQuestion): void {
    const text = question.text.trim();
    if (!text) {
      return;
    }

    const degree = Number(question.degree);
    if (!Number.isFinite(degree) || degree <= 0) {
      return;
    }

    const options = this.normalizeOptionsText(question.optionsText);
    let correctOptionText = question.correctOptionText.trim();

    if (question.questionType === QuestionType.Essay) {
      correctOptionText = '';
    }

    if (question.questionType === QuestionType.TrueFalse) {
      if (correctOptionText !== 'True' && correctOptionText !== 'False') {
        correctOptionText = 'True';
      }
    }

    if (question.questionType === QuestionType.MultipleChoice) {
      if (options.length < 2) {
        return;
      }

      if (!correctOptionText || !options.includes(correctOptionText)) {
        correctOptionText = options[0];
      }
    }

    this.submitUpdateQuestion.emit({
      id: question.id,
      text,
      questionType: question.questionType,
      degree,
      options: question.questionType === QuestionType.Essay ? [] : options,
      correctOptionText,
    });
  }

  protected selectedQuestionDegree(question: IQuestionResponse): number {
    const selected = this.selectedQuestionDegrees[question.id];
    if (Number.isFinite(selected) && selected > 0) {
      return this.normalizeDegree(selected);
    }

    return this.normalizeDegree(question.degree);
  }

  protected onSelectedDegreeChanged(questionId: number, value: string | number): void {
    this.selectedQuestionDegreeChanged.emit({
      id: questionId,
      degree: this.normalizeDegree(value),
    });
  }

  private normalizeCreatePayload(): {
    questionType: number;
    options: string[];
    correctOptionText: string;
  } | null {
    const questionType = Number(this.createDraft.questionType);

    if (questionType === QuestionType.Essay) {
      return {
        questionType,
        options: [],
        correctOptionText: '',
      };
    }

    if (questionType === QuestionType.TrueFalse) {
      const correct =
        this.createDraft.correctOptionText === 'False'
          ? 'False'
          : this.createDraft.correctOptionText === 'True'
            ? 'True'
            : 'True';

      return {
        questionType,
        options: ['True', 'False'],
        correctOptionText: correct,
      };
    }

    const cleanedOptions = this.createDraft.options
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    if (cleanedOptions.length < 2) {
      return null;
    }

    let correct = this.createDraft.correctOptionText.trim();
    if (!correct || !cleanedOptions.includes(correct)) {
      correct = cleanedOptions[0];
    }

    return {
      questionType: QuestionType.MultipleChoice,
      options: cleanedOptions,
      correctOptionText: correct,
    };
  }

  private normalizeOptionsText(value: string): string[] {
    return value
      .split('|')
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
  }

  private normalizeDegree(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 1;
    }

    return Math.floor(parsed);
  }

  private resetCreateDraft(): void {
    this.createDraft = this.createDefaultDraft();
    this.selectedMediaName = '';
  }

  private createDefaultDraft(): BuilderCreateQuestionPayload {
    return {
      text: '',
      questionType: QuestionType.MultipleChoice,
      degree: 10,
      options: ['', ''],
      correctOptionText: '',
      mediaFile: null,
    };
  }
}
