import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IExamQuestionsAnswers,
} from '../../../../../data/models/StudentExam/IResultExam';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-question-review-card',
  imports: [CommonModule],
  templateUrl: './question-review-card.component.html',
  styleUrl: './question-review-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionReviewCardComponent {
  @Input({ required: true }) question!: IExamQuestionsAnswers;
  @Input({ required: true }) index!: number;

  imageError = false;

  private readonly mediaBaseUrl = environment.apiUrl.replace(/\/api$/, '');

  protected get imageUrl(): string | null {
    if (!this.question.imagePath) {
      return null;
    }

    return this.question.imagePath.startsWith('http')
      ? this.question.imagePath
      : `${this.mediaBaseUrl}${this.question.imagePath}`;
  }
}
