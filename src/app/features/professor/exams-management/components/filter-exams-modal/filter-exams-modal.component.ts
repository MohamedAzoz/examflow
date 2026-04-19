import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfessorExamStatus } from '../../../../../data/enums/ProfessorExamStatus';

@Component({
  selector: 'app-filter-exams-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 z-350 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 class="text-sm font-bold text-gray-900" id="modal-title">Filter Exams</h3>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 transition"
              (click)="onClose()"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 flex flex-col gap-5">
            Course
            <div>
              <label
                class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
                >Course</label
              >
              <div class="relative">
                <select
                  class="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  [(ngModel)]="selectedCourse"
                >
                  <option [value]="null">All Courses</option>
                  <!-- Add options dynamically later -->
                </select>
                <i
                  class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none"
                ></i>
              </div>
            </div>

            <!-- Semester -->
            <div>
              <label
                class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
                >Semester</label
              >
              <div class="relative">
                <select
                  class="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  [(ngModel)]="selectedSemester"
                >
                  <option [value]="null">Spring 2026</option>
                </select>
                <i
                  class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none"
                ></i>
              </div>
            </div>

            <!-- Level -->
            <div>
              <label
                class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
                >Level</label
              >
              <div class="relative">
                <select
                  class="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  [(ngModel)]="selectedLevel"
                >
                  <option [value]="null">All Levels</option>
                  <option [value]="1">Level 1</option>
                  <option [value]="2">Level 2</option>
                  <option [value]="3">Level 3</option>
                  <option [value]="4">Level 4</option>
                </select>
                <i
                  class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none"
                ></i>
              </div>
            </div>

            <!-- Status -->
            <div>
              <label
                class="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5"
                >Status</label
              >
              <div class="relative">
                <select
                  class="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  [(ngModel)]="selectedStatus"
                >
                  <option [value]="null">All Status</option>
                  <option [value]="0">Draft</option>
                  <option [value]="1">Published</option>
                  <option [value]="2">Completed</option>
                  <option [value]="3">Pending Manual Grading</option>
                  <option [value]="4">All Graded</option>
                </select>
                <i
                  class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none"
                ></i>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-4 bg-gray-50/50">
            <button
              type="button"
              class="text-xs font-semibold text-gray-500 hover:text-gray-800 transition"
              (click)="onClearAll()"
            >
              Clear All
            </button>
            <button
              type="button"
              class="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
              (click)="onApplyFilters()"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterExamsModalComponent {
  readonly visible = input<boolean>(false);
  readonly closeModal = output<void>();
  readonly applyFilters = output<any>();

  selectedCourse: any = null;
  selectedSemester: any = null;
  selectedLevel: any = null;
  selectedStatus: any = null;

  readonly examStatus = ProfessorExamStatus;

  onClose() {
    this.closeModal.emit();
  }

  onClearAll() {
    this.selectedCourse = null;
    this.selectedSemester = null;
    this.selectedLevel = null;
    this.selectedStatus = null;
  }

  onApplyFilters() {
    this.applyFilters.emit({
      course: this.selectedCourse,
      semester: this.selectedSemester,
      level: this.selectedLevel,
      status: this.selectedStatus,
    });
    this.onClose();
  }
}
