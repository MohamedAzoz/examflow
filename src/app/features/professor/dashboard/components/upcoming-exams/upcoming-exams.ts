import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpcomingExamData } from '../../../../../data/models/ProfessorDashboard/UpcomingExamData';

@Component({
  selector: 'app-upcoming-exams',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-card-bg rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-text-dark">Upcoming Exams</h2>
        <button
          class="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
        >
          View All <i class="pi pi-angle-right text-[10px]"></i>
        </button>
      </div>

      <div class="grow flex flex-col gap-6 relative">
        <!-- Connecting vertical line -->
        <div
          class="absolute left-[5px] top-2 bottom-6 w-px border-l border-dashed border-slate-200 z-0"
        ></div>

        @if (exams().length === 0) {
          <div class="text-sm text-text-gray italic text-center mt-4">No upcoming exams.</div>
        }

        @for (exam of exams(); track exam.examTitle; let first = $first) {
          <div class="relative z-10 flex gap-4">
            <!-- Timeline Dot -->
            <div class="pt-1 shrink-0">
              <div
                class="w-[11px] h-[11px] rounded-full"
                [ngClass]="first ? 'bg-teal-700' : 'bg-slate-300'"
              ></div>
            </div>

            <!-- Exam Info -->
            <div class="grow pb-1">
              <p
                class="text-[10px] font-bold uppercase tracking-wider mb-1"
                [ngClass]="first ? 'text-teal-700' : 'text-text-secondary'"
              >
                {{ exam.startTime | date: 'MMM d, hh:mm a' }}
              </p>
              <h3 class="text-sm font-semibold text-text-dark mb-1">{{ exam.examTitle }}</h3>
              <p class="text-xs text-text-gray font-medium flex items-center gap-1 flex-wrap">
                {{ exam.durationMinutes }} Mins &bull; Level {{ exam.academicLevel }}
                @if (exam.departmentCodes && exam.departmentCodes.length) {
                  &bull; {{ getDepartmentCodesStr(exam.departmentCodes) }}
                }
              </p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class UpcomingExamsComponent {
  exams = input<UpcomingExamData[]>([]);

  getDepartmentCodesStr(codes: { code: string }[]): string {
    return codes.map((c) => c.code).join(', ');
  }
}
