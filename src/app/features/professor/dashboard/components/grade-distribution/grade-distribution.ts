import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Charts } from '../../../../../data/models/ProfessorDashboard/Charts';
import { LastExam } from '../../../../../data/models/ProfessorDashboard/LastExam';

@Component({
  selector: 'app-grade-distribution',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-card-bg rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col min-h-[350px]">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-text-dark">Grade Distribution</h2>
        
        <div class="relative">
          <select 
            class="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-text-secondary focus:outline-none focus:border-teal-600 cursor-pointer"
            [ngModel]="selectedExamId()"
            (ngModelChange)="onExamChange($event)"
          >
            @if (!lastExams().length) {
              <option value="null">Loading exams...</option>
            }
            @for (exam of lastExams(); track exam.id) {
              <option [value]="exam.id">{{ exam.examTitle }}</option>
            }
          </select>
          <i class="pi pi-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary pointer-events-none"></i>
        </div>
      </div>

      <div class="grow flex items-end justify-between gap-4 mt-8 relative pb-8 px-8 h-[200px]">
        <!-- Y Axis Markers -->
        <div class="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-text-gray font-bold opacity-70 z-0">
          <span>{{ maxValue() }}</span>
          <span>{{ halfValue() }}</span>
          <span>0</span>
        </div>
        
        <!-- Grid lines -->
        <div class="absolute left-6 right-0 top-0 h-px bg-slate-100 z-0"></div>
        <div class="absolute left-6 right-0 top-[40%] h-px bg-slate-50 z-0"></div>
        <div class="absolute left-6 right-0 bottom-8 h-px bg-slate-200 z-0"></div>

        <!-- Bars -->
        @for (item of chartData(); track item.label) {
          <div class="relative flex-1 flex flex-col items-center group z-10 h-full justify-end">
            <div 
              class="w-full max-w-[40px] bg-teal-700 rounded-t-md transition-all duration-700 ease-out hover:bg-teal-600 relative cursor-pointer"
              [style.height.%]="item.percentage"
            >
              <!-- Tooltip -->
              <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-20">
                <span class="font-bold">{{ item.value }}</span> Students
                <div class="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
              </div>
            </div>
            <div class="absolute -bottom-7 flex flex-col items-center">
              <span class="text-xs font-black text-text-dark">{{ item.label }}</span>
              <span class="text-[8px] font-bold text-text-gray uppercase tracking-tighter">{{ item.subLabel }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class GradeDistributionComponent {
  chartDataInput = input<Charts | null>(null);
  lastExams = input<LastExam[]>([]);
  selectedExamId = input<number | null>(null);
  
  examSelected = output<number>();

  // Computed data for the chart
  maxValue = computed(() => {
    const data = this.chartDataInput();
    if (!data) return 100;
    const max = Math.max(data.gradeA, data.gradeB, data.gradeC, data.gradeD, data.gradeF);
    return max > 0 ? max : 100; // avoid division by zero
  });

  halfValue = computed(() => Math.floor(this.maxValue() / 2));

  chartData = computed(() => {
    const data = this.chartDataInput();
    const max = this.maxValue();
    
    if (!data) {
      return [
        { label: 'A', subLabel: 'Excellent', value: 0, percentage: 0 },
        { label: 'B', subLabel: 'Very Good', value: 0, percentage: 0 },
        { label: 'C', subLabel: 'Good', value: 0, percentage: 0 },
        { label: 'D', subLabel: 'Pass', value: 0, percentage: 0 },
        { label: 'F', subLabel: 'Fail', value: 0, percentage: 0 },
      ];
    }

    return [
      { label: 'A', subLabel: 'Excellent', value: data.gradeA, percentage: (data.gradeA / max) * 100 },
      { label: 'B', subLabel: 'Very Good', value: data.gradeB, percentage: (data.gradeB / max) * 100 },
      { label: 'C', subLabel: 'Good', value: data.gradeC, percentage: (data.gradeC / max) * 100 },
      { label: 'D', subLabel: 'Pass', value: data.gradeD, percentage: (data.gradeD / max) * 100 },
      { label: 'F', subLabel: 'Fail', value: data.gradeF, percentage: (data.gradeF / max) * 100 },
    ];
  });

  onExamChange(examIdStr: string | number) {
    const id = Number(examIdStr);
    if (!isNaN(id)) {
      this.examSelected.emit(id);
    }
  }
}
