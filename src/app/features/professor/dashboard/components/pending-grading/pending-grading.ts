import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingGradingData } from '../../../../../data/models/ProfessorDashboard/PendingGradingData';
import { RouterLink } from '@angular/router';
import { ROUTESPROFESSOR } from '../../../../../core/constants/const.route';

@Component({
  selector: 'app-pending-grading',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-card-bg rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <h2 class="text-lg font-bold text-text-dark">Grading Queue</h2>
        <span
          class="bg-[#fdf4ee] text-[#b37042] text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border border-[#f5e6dc]"
        >
          Urgent Tasks
        </span>
      </div>

      <div class="grow flex flex-col gap-3">
        @if (pendingGrading().length === 0) {
          <div class="text-sm text-text-gray italic text-center mt-4">
            No pending grading tasks.
          </div>
        }

        @for (item of pendingGrading(); track item.examId) {
          <div
            class="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-surface hover:border-orange-200 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100"
              >
                <i class="pi pi-file-edit text-orange-800 text-lg"></i>
              </div>
              <div>
                <h3 class="text-sm font-bold text-text-dark mb-0.5">
                  {{ item.courseName }}: {{ item.examTitle }}
                </h3>
                <p class="text-xs font-bold text-orange-800">
                  {{ item.pendingStudentsExamsPapers }} Papers pending
                </p>
              </div>
            </div>
            <button
              class="bg-[#185b5d] hover:bg-[#124546] text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer border-none"
              [routerLink]="getRoute(item)">
              Start Grading
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class PendingGradingComponent {
  pendingGrading = input<PendingGradingData[]>([]);

  getRoute(exam: PendingGradingData) {
    return `/main/professor/my-courses/1/exams/${exam.examId}/grade`;
  }
}
