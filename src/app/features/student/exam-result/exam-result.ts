import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StudentExamFacade } from '../services/student-exam-facade';
import { ResultSummaryCardComponent } from './components/result-summary-card/result-summary-card.component';
import { QuestionReviewCardComponent } from './components/question-review-card/question-review-card.component';
import { EssayReviewCardComponent } from './components/essay-review-card/essay-review-card.component';

@Component({
  selector: 'app-exam-result',
  imports: [
    CommonModule,
    RouterLink,
    ResultSummaryCardComponent,
    QuestionReviewCardComponent,
    EssayReviewCardComponent,
  ],
  templateUrl: './exam-result.html',
  styleUrl: './exam-result.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamResultComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(StudentExamFacade);

  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly lastLoadedExamId = signal<number | null>(null);

  readonly examId = computed(() => Number(this.params().get('examId') ?? 0));
  readonly examResult = this.facade.examResults;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;

  readonly objectiveQuestions = computed(() => this.examResult()?.examQuestionsAnswers ?? []);
  readonly essayQuestions = computed(() => this.examResult()?.examEssaysQuestions ?? []);
  readonly answeredCorrectlyCount = computed(
    () => this.objectiveQuestions().filter((question) => question.answerStatus).length,
  );
  readonly totalQuestionsCount = computed(
    () => this.objectiveQuestions().length + this.essayQuestions().length,
  );

  constructor() {
    effect(() => {
      const examId = this.examId();
      if (!examId || this.lastLoadedExamId() === examId) {
        return;
      }

      this.lastLoadedExamId.set(examId);
      this.facade.getExamResults(examId);
    });
  }

  protected reload(): void {
    const examId = this.examId();
    if (!examId) {
      return;
    }

    this.facade.getExamResults(examId);
  }
}
