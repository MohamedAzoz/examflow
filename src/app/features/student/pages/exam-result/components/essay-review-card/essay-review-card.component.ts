import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IExamEssaysQuestion,
} from '../../../../../../data/models/StudentExam/IResultExam';
import { environment } from '../../../../../../../environments/environment.development';

@Component({
  selector: 'app-essay-review-card',
  imports: [CommonModule],
  templateUrl: './essay-review-card.component.html',
  styleUrl: './essay-review-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayReviewCardComponent {
  @Input({ required: true }) question!: IExamEssaysQuestion;
  @Input({ required: true }) index!: number;

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
