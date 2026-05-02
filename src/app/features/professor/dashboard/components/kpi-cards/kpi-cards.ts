import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KPI } from '../../../../../data/models/ProfessorDashboard/KPI';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Active Courses -->
      <div
        class="bg-card-bg rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            Active Courses
          </p>
          <p class="text-4xl font-bold text-text-dark">{{ kpis()?.activeCourses || 0 }}</p>
        </div>
        <div class="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
          <i class="pi pi-book text-cyan-800 text-xl"></i>
        </div>
      </div>

      <!-- Active Exams -->
      <div
        class="bg-card-bg rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            Active Exams
          </p>
          <p class="text-4xl font-bold text-text-dark">{{ kpis()?.activeExams || 0 }}</p>
        </div>
        <div class="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
          <i class="pi pi-asterisk text-teal-800 text-xl"></i>
        </div>
      </div>

      <!-- Pending Grading -->
      <div
        class="bg-card-bg rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-bold text-[#8a6a51] uppercase tracking-wider mb-2">
            Pending Grading
          </p>
          <p class="text-4xl font-bold text-text-dark">{{ kpis()?.pendingGradingPapers || 0 }}</p>
        </div>
        <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <i class="pi pi-clipboard text-orange-800 text-xl"></i>
        </div>
      </div>
    </div>
  `,
})
export class KpiCardsComponent {
  kpis = input<KPI | null>(null);
}
