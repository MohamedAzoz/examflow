import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { data } from '../../../../../data/models/StudentExam/IpastExams';
import { getExamStatusMeta } from '../../../../../shared/utils/exam-status-meta';

@Component({
  selector: 'app-result-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './result-card.component.html',
  styleUrl: './result-card.component.css',
})
export class ResultCardComponent {
  @Input({ required: true }) result!: data;

  protected readonly statusMeta = computed(() => getExamStatusMeta(this.result.examStatus));

  getScoreColor(result: data): string {
    const percentage = (result.studentScore / result.examMaxScore) * 100;
    if (percentage >= 50) return 'text-success';
    return 'text-danger';
  }
}
