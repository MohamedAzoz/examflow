import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IExamQuestionsAnswers } from '../../../../../data/models/StudentExam/IResultExam';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-question-review-card',
  imports: [CommonModule],
  templateUrl: './question-review-card.component.html',
  styleUrl: './question-review-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionReviewCardComponent implements OnChanges {
  @Input({ required: true }) question!: IExamQuestionsAnswers;
  @Input({ required: true }) index!: number;
  imageError = false;
  protected get imageUrl(): string | null {
    if (!this.question.imagePath) {
      return null;
    }
    return this.question.imagePath.startsWith('http')
      ? this.question.imagePath
      : `${environment.baseUrl}${this.question.imagePath}`;
  }

  protected get studentAnswerText(): string {
    const value = this.question.selectedOptionText?.trim();
    return value ? value : 'No answer provided';
  }

  protected get correctAnswerText(): string {
    return this.question.correctOptionText?.trim() ?? '';
  }

  ngOnChanges(_: SimpleChanges): void {
    this.imageError = false;
  }
}
