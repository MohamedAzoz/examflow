import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecentExamData } from '../../../../../data/models/ProfessorDashboard/RecentExamData';
import { IPaginatedResponse } from '../../../../../data/models/IPaginatedResponse';
import { RecentExamSearchParams } from '../../../../../data/models/ProfessorDashboard/RecentExamSearchParams';

@Component({
  selector: 'app-recent-exams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-card-bg rounded-2xl p-6 shadow-sm border border-slate-100">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-text-dark">Recent Exams Overview</h2>
        <!-- (click)="openModal()" -->
        <button
          class="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
        >
          View All <i class="pi pi-angle-right text-[10px]"></i>
        </button>
      </div>

      <!-- Compact Table / List -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr
              class="text-[10px] text-text-gray uppercase tracking-wider border-b border-slate-100"
            >
              <th class="pb-3 font-bold px-2">Identity</th>
              <th class="pb-3 font-bold px-2 text-center">Attendance</th>
              <th class="pb-3 font-bold px-2 text-center">Security Status</th>
              <th class="pb-3 font-bold px-2 text-center">Difficulty</th>
              <th class="pb-3 font-bold px-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (recentExams().data.length === 0) {
              <tr>
                <td colspan="5" class="py-6 text-center text-text-gray text-sm italic">
                  No recent exams found.
                </td>
              </tr>
            }
            @for (exam of recentExams().data.slice(0, 3); track exam.examTitle) {
              <tr
                class="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <td class="py-4 px-2">
                  <p class="font-bold text-text-dark mb-1">
                    {{ exam.courseName }} - {{ exam.examTitle }}
                  </p>
                  <p class="text-[10px] text-text-gray font-medium">
                    {{ exam.startTime | date: 'MMM d' }} &bull; Level {{ exam.academicLevel }}
                    @if (exam.departmentCodes && exam.departmentCodes.length) {
                      &bull; {{ getDepartmentCodesStr(exam.departmentCodes) }}
                    }
                  </p>
                </td>
                <td class="py-4 px-2 text-center text-xs font-bold text-text-secondary">
                  {{ exam.attendStudents }}/{{ exam.attendStudents + exam.absentStudents }}
                  <i class="pi pi-users ml-1 text-text-gray text-[10px]"></i>
                </td>
                <td class="py-4 px-2 text-center">
                  <span
                    class="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold"
                    [ngClass]="getSecurityStatusClass(exam.cheatFlag)"
                  >
                    {{ exam.cheatFlag }}% Flagged
                  </span>
                </td>
                <td class="py-4 px-2 text-center">
                  <span
                    class="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold"
                  >
                    {{ exam.questionsDifficulty }}% Hard
                  </span>
                </td>
                <td class="py-4 px-2 text-center">
                  <button
                    (click)="onDownload(exam)"
                    class="text-teal-600 hover:text-teal-800 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <i class="pi pi-download"></i>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- View All Modal Overlay -->
    <!-- @if (isModalOpen()) {
      <div class="fixed inset-0 z-1000 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div (click)="closeModal()" class="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>

        <div
          class="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden animate-zoom-in border border-slate-200"
        >
          <div
            class="flex justify-between items-center p-8 border-b border-slate-100 bg-white sticky top-0 z-20"
          >
            <div>
              <h2 class="text-2xl font-black text-slate-900 tracking-tight">
                Recent Exams Repository
              </h2>
              <p class="text-sm text-slate-500 font-medium mt-1">
                Detailed overview and analytics of your recent assessments
              </p>
            </div>
            <button
              (click)="closeModal()"
              class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 cursor-pointer border-none group"
            >
              <i class="pi pi-times group-hover:rotate-90 transition-transform duration-300"></i>
            </button>
          </div>

          <div
            class="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-6 justify-between items-center shrink-0"
          >
            <div class="relative w-full max-w-md">
              <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Search by exam title or course..."
                class="w-full pl-11 pr-5 py-3 rounded-2xl border-none bg-white shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
              />
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                >Sort by</span
              >
              <select
                class="bg-white border-none shadow-sm rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer min-w-[160px]"
                [ngModel]="currentSearchParams().SortingOptions"
                (ngModelChange)="onSortChange($event)"
              >
                <option [value]="0">Latest Created</option>
                <option [value]="1">Oldest Created</option>
                <option [value]="5">Cheating Flags</option>
                <option [value]="7">Questions Difficulty</option>
              </select>
            </div>
          </div>

          <div class="grow overflow-auto bg-white p-2">
            <table
              class="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-y-2"
            >
              <thead class="sticky top-0 bg-white z-10">
                <tr class="text-[11px] text-slate-400 font-black uppercase tracking-[0.15em]">
                  <th class="py-4 px-6 text-left">Assessment Identity</th>
                  <th class="py-4 px-6 text-center">Attendance</th>
                  <th class="py-4 px-6 text-center">Security Level</th>
                  <th class="py-4 px-6 text-center">Complexity</th>
                  <th class="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (!recentExams()?.data?.length) {
                  <tr>
                    <td colspan="5" class="py-24 text-center">
                      <div class="flex flex-col items-center opacity-40">
                        <i class="pi pi-inbox text-5xl mb-4"></i>
                        <p class="text-lg font-bold">No Records Found</p>
                        <p class="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                }
                @for (exam of recentExams()?.data; track exam.examTitle) {
                  <tr class="group hover:bg-slate-50 transition-all duration-300">
                    <td
                      class="py-4 px-6 rounded-l-2xl border-y border-l border-transparent group-hover:border-slate-100"
                    >
                      <div class="flex flex-col">
                        <span class="font-black text-slate-900 text-base mb-0.5">{{
                          exam.examTitle
                        }}</span>
                        <div class="flex items-center gap-2">
                          <span
                            class="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-black uppercase"
                            >{{ exam.courseName }}</span
                          >
                          <span class="text-[11px] text-slate-400 font-bold">{{
                            exam.startTime | date: 'mediumDate'
                          }}</span>
                        </div>
                      </div>
                    </td>
                    <td
                      class="py-4 px-6 text-center border-y border-transparent group-hover:border-slate-100"
                    >
                      <div
                        class="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"
                      >
                        <span class="text-sm font-black text-slate-700">{{
                          exam.attendStudents
                        }}</span>
                        <span class="text-xs text-slate-400 font-bold"
                          >/ {{ exam.attendStudents + exam.absentStudents }}</span
                        >
                      </div>
                    </td>
                    <td
                      class="py-4 px-6 text-center border-y border-transparent group-hover:border-slate-100"
                    >
                      <span
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider"
                        [ngClass]="getSecurityStatusClass(exam.cheatFlag)"
                      >
                        <i class="pi pi-shield text-[10px]"></i>
                        {{ exam.cheatFlag }}% Flagged
                      </span>
                    </td>
                    <td
                      class="py-4 px-6 text-center border-y border-transparent group-hover:border-slate-100"
                    >
                      <div class="flex flex-col items-center gap-1">
                        <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            class="h-full bg-slate-400 rounded-full"
                            [style.width.%]="exam.questionsDifficulty"
                          ></div>
                        </div>
                        <span class="text-[10px] font-black text-slate-400 uppercase"
                          >{{ exam.questionsDifficulty }}% Complexity</span
                        >
                      </div>
                    </td>
                    <td
                      class="py-4 px-6 text-right rounded-r-2xl border-y border-r border-transparent group-hover:border-slate-100"
                    >
                      <button
                        (click)="onDownload(exam.examId)"
                        class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all duration-300 cursor-pointer border-none shadow-sm flex items-center justify-center ml-auto"
                        title="Download Report"
                      >
                        <i class="pi pi-download"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div
            class="p-6 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white"
          >
            <div class="flex items-center gap-3">
              <div class="flex -space-x-2">
                @for (i of [1, 2, 3]; track i) {
                  <div class="w-8 h-8 rounded-full border-2 border-white bg-slate-100"></div>
                }
              </div>
              <p class="text-xs font-bold text-slate-400">
                Viewing
                <span class="text-slate-900">{{ recentExams()?.data?.length || 0 }}</span> records
                from <span class="text-slate-900">{{ recentExams()?.totalSize || 0 }}</span>
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                class="px-4 py-2 rounded-xl border border-slate-100 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white transition-all shadow-sm flex items-center gap-2"
                [disabled]="currentSearchParams().PageIndex === 1"
                (click)="onPageChange(currentSearchParams().PageIndex - 1)"
              >
                <i class="pi pi-arrow-left text-[10px]"></i> Previous
              </button>

              <div class="flex items-center gap-1 px-2">
                @for (p of [].constructor(totalPages()); track $index) {
                  <button
                    (click)="onPageChange($index + 1)"
                    class="w-8 h-8 rounded-lg text-xs font-black transition-all"
                    [ngClass]="
                      $index + 1 === currentSearchParams().PageIndex
                        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                        : 'text-slate-400 hover:bg-slate-100'
                    "
                  >
                    {{ $index + 1 }}
                  </button>
                }
              </div>

              <button
                class="px-4 py-2 rounded-xl border border-slate-100 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-white transition-all shadow-sm flex items-center gap-2"
                [disabled]="currentSearchParams().PageIndex === (totalPages() || 0)"
                (click)="onPageChange((currentSearchParams().PageIndex || 1) + 1)"
              >
                Next <i class="pi pi-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    } -->
  `,
  styles: [
    `
      .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }
      .animate-zoom-in {
        animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes zoomIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `,
  ],
})
export class RecentExamsComponent {
  recentExams = input.required<IPaginatedResponse<RecentExamData>>();
  currentSearchParams = input.required<RecentExamSearchParams>();

  searchChanged = output<Partial<RecentExamSearchParams>>();
  downloadReport = output<RecentExamData>();

  onDownload(exam: RecentExamData) {
    this.downloadReport.emit(exam);
  }

  isModalOpen = signal(false);
  searchQuery = signal('');

  totalPages = computed(() => {
    const total = this.recentExams()?.totalSize || 0;
    const size = this.currentSearchParams().PageSize || 10;
    return Math.ceil(total / size);
  });

  private searchTimeout: any;

  getDepartmentCodesStr(codes: { code: string }[]): string {
    return codes.map((c) => c.code).join(', ');
  }

  getSecurityStatusClass(flagPct: number): string {
    if (flagPct > 5) return 'bg-yellow-100 text-yellow-800';
    if (flagPct > 0) return 'bg-green-100 text-green-800';
    return 'bg-slate-100 text-slate-600';
  }

  openModal() {
    this.searchQuery.set(this.currentSearchParams().ExamTitleSearch || '');
    this.isModalOpen.set(true);
    // Reset to page 1 and larger page size when opening modal
    this.searchChanged.emit({ PageIndex: 1, PageSize: 10 });
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.isModalOpen.set(false);
    // Revert to small page size for the compact view
    this.searchChanged.emit({ PageIndex: 1, PageSize: 5 });
    document.body.style.overflow = '';
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchChanged.emit({ ExamTitleSearch: query, PageIndex: 1 });
    }, 500); // debounce 500ms
  }

  onSortChange(sortOptionStr: string | number) {
    const sortOpt = Number(sortOptionStr);
    this.searchChanged.emit({ SortingOptions: sortOpt, PageIndex: 1 });
  }

  onPageChange(newPageIndex: number) {
    this.searchChanged.emit({ PageIndex: newPageIndex });
  }
}
