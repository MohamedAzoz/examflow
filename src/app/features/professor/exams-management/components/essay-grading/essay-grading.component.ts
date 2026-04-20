import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EssayGradingFacade } from '../../../services/essay-grading.facade';

@Component({
  selector: 'app-essay-grading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './essay-grading.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayGradingComponent {
  readonly courseId = input.required<string | number>();

  protected readonly facade = inject(EssayGradingFacade);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  private readonly params = computed(() => {
    return this.route.snapshot.params;
  });

  private readonly examId = computed(() => {
    return this.params()['examId'];
  });

  private readonly pageIndex = signal(1);
  private readonly pageSize = signal(1);

  constructor() {
    effect(() => {
      const id = Number(this.examId());
      const pageIndex = this.pageIndex();
      const pageSize = this.pageSize();
      if (id > 0) {
        this.facade.loadStudentsEssaysForGrading(id, pageIndex, pageSize);
      }
    });
  }

  canSubmit(): boolean {
    const details = this.facade.studentEssays();
    if (!details || !details.data || details.data.length === 0) return false;
    return details.data[0].essayQuestions.every(
      (q) => q.score !== undefined && q.score !== null,
    );
  }

  onBackToExams() {
    this.facade.clear();
    this.location.back();
  }

  onSkip() {
    this.facade.loadStudentsEssaysForGrading(
      Number(this.examId()),
      this.pageIndex(),
      this.pageSize(),
    );
  }

  onSubmit() {
    const details = this.facade.studentEssays();
    if (!details || !details.data || details.data.length === 0) return;

    const studentData = details.data[0];
    const payload = {
      examId: Number(this.examId()),
      studentId: studentData.studentId,
      essayGrades: studentData.essayQuestions.map((q) => ({
        questionId: q.questionId,
        assignedScore: q.score!,
      })),
    };

    this.facade.submitGrades(payload).subscribe(() => {
      this.facade.loadStudentsEssaysForGrading(
        Number(this.examId()),
        this.pageIndex(),
        this.pageSize(),
      );
    });
  }
}
