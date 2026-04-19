import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EssayGradingFacade, EssaySubmission } from '../../../services/essay-grading.facade';

@Component({
  selector: 'app-essay-grading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      @if (facade.loading()) {
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <i class="pi pi-spin pi-spinner text-4xl text-emerald-600 mb-4"></i>
          <p class="text-sm font-semibold tracking-widest text-emerald-800 uppercase">Loading Student Essays...</p>
        </div>
      }
      
      @if (facade.error()) {
        <div class="absolute inset-x-0 top-0 z-50 p-4">
          <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm flex items-center justify-between">
            <span class="text-sm font-medium"><i class="pi pi-exclamation-triangle mr-2"></i>{{ facade.error() }}</span>
            <button class="hover:text-red-900" (click)="facade.clear()"><i class="pi pi-times"></i></button>
          </div>
        </div>
      }

      <!-- Top Navigation Header -->
      <header class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div class="flex items-center gap-6">
          <button 
            type="button" 
            class="group flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition"
            (click)="onBackToExams()"
          >
            <i class="pi pi-chevron-left text-[10px] group-hover:-translate-x-0.5 transition-transform"></i>
            Back to Exams
          </button>
          
          <div class="h-5 w-px bg-gray-300"></div>
          
          <h1 class="text-lg font-black tracking-tight text-emerald-800 uppercase">
            EXAMFLOW
          </h1>
        </div>

        <h2 class="text-sm font-bold text-gray-800">
          {{ facade.studentEssays()?.examTitle || 'Exam Title' }}
        </h2>

        <div class="flex items-center">
          <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            PENDING PAPERS: {{ facade.studentEssays()?.totalPendingStudents || 0 }}
          </span>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-8 relative">
        <div class="max-w-4xl mx-auto">
          @if (facade.studentEssays(); as details) {
            <!-- Student Info Header -->
            <div class="mb-8">
              <h3 class="text-sm font-bold text-gray-900 mb-1">
                Grading Student: <span class="text-emerald-500">{{ details.universityId || 'Unknown' }}</span>
              </h3>
              <p class="text-xs text-gray-500">Reviewing {{ details.essays.length }} Essay Questions</p>
            </div>

            <div class="flex flex-col gap-6">
              @for (essay of details.essays; track essay.questionId; let i = $index) {
                <div class="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 relative group">
                  <div class="flex items-center justify-between mb-4">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      QUESTION {{ i + 1 }}
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      <i class="pi pi-star-fill text-[8px] text-gray-400"></i>
                      MAX: {{ essay.maxScore }} PTS
                    </span>
                  </div>
                  
                  <h4 class="text-sm font-bold text-gray-900 mb-6 leading-relaxed" [innerHTML]="essay.questionText"></h4>

                  <div class="rounded-xl bg-slate-50 p-6 text-sm text-gray-700 leading-relaxed font-serif border border-slate-100 mb-8 whitespace-pre-line">
                    {{ essay.studentAnswer || 'No answer provided.' }}
                  </div>

                  <div class="flex items-center justify-end gap-3">
                    <label class="text-sm font-bold" [class.text-red-600]="essay.score === undefined" [class.text-gray-900]="essay.score !== undefined">Score:</label>
                    <div class="flex items-center gap-2">
                      <input 
                        type="number" 
                        class="h-12 w-20 rounded-lg border bg-white text-center text-xl font-bold text-emerald-600 outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                        [class.border-gray-200]="essay.score !== undefined"
                        [class.border-red-300]="essay.score === undefined"
                        [class.bg-red-50]="essay.score === undefined"
                        [(ngModel)]="essay.score"
                        [max]="essay.maxScore"
                        min="0"
                      />
                      <span class="text-sm font-medium text-gray-400">/ {{ essay.maxScore }} Pts</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else if (!facade.loading()) {
            <div class="flex flex-col items-center justify-center py-20 text-center">
              <i class="pi pi-check-circle text-5xl text-emerald-600 mb-4"></i>
              <h2 class="text-xl font-bold text-gray-900">All Done!</h2>
              <p class="text-sm text-gray-500 mt-2">There are no pending essays to grade for this exam.</p>
              <button class="mt-6 btn rounded-xl bg-gray-100 px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200" (click)="onBackToExams()">Go back to exams</button>
            </div>
          }
        </div>
      </main>

      <!-- Bottom Sticky Footer bar -->
      @if (facade.studentEssays()) {
        <footer class="sticky bottom-0 z-10 flex h-20 items-center justify-between border-t border-gray-200 bg-white px-8 lg:px-32">
          <button 
            type="button" 
            class="text-sm font-bold text-gray-500 hover:text-gray-900 transition"
            (click)="onSkip()"
          >
            Skip for now
          </button>
          <button 
            type="button" 
            class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="onSubmit()"
            [disabled]="!canSubmit()"
          >
            <i class="pi pi-check-circle" aria-hidden="true"></i>
            Submit & Next Student
          </button>
        </footer>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EssayGradingComponent {

  readonly courseId = input.required<string | number>();
  
  protected readonly facade = inject(EssayGradingFacade);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);

  private readonly params=computed(()=>{
    return this.route.snapshot.params;
  })

  private readonly examId=computed(()=>{
    return this.params()['examId'];
  })

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
    if (!details || !details.essays) return false;
    return details.essays.every(e => e.score !== undefined && e.score !== null);
  }

  onBackToExams() {
    this.facade.clear();
    this.location.back();
  }

  onSkip() {
    this.facade.loadStudentsEssaysForGrading(Number(this.examId()), this.pageIndex(), this.pageSize());
  }

  onSubmit() {
    const details = this.facade.studentEssays();
    if (!details) return;

    const payload = details.essays.map(essay => ({
      examId: details.examId,
      studentId: details.studentId,
      questionId: essay.questionId,
      grade: essay.score!
    }));

    this.facade.submitGrades(payload).subscribe(() => {
      this.facade.loadStudentsEssaysForGrading(Number(this.examId()), this.pageIndex(), this.pageSize());
    });
  }
}
