import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../environments/environment.development';
import { IExamEssaysQuestion } from '../../../../../data/models/StudentExam/IResultExam';

@Component({
  selector: 'app-essay-review-card',
  imports: [CommonModule],
  templateUrl: './essay-review-card.component.html',
  styleUrl: './essay-review-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayReviewCardComponent implements OnChanges {
  @Input({ required: true }) question!: IExamEssaysQuestion;
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

  protected get essayAnswerText(): string {
    const value = this.question.essayAnswer?.trim();
    return value ? value : 'No written answer was submitted.';
  }

  ngOnChanges(_: SimpleChanges): void {
    this.imageError = false;
  }
}
