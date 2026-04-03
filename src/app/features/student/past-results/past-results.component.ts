import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentExamFacade } from '../services/student-exam-facade';
import { ResultCardComponent } from './components/result-card/result-card.component';

@Component({
  selector: 'app-past-results',
  standalone: true,
  imports: [CommonModule, ResultCardComponent],
  templateUrl: './past-results.component.html',
  styleUrl: './past-results.component.css',
})
export class PastResultsComponent implements OnInit {
  private readonly facade = inject(StudentExamFacade);

  readonly pastExams = this.facade.pastExams;
  readonly isLoading = this.facade.isLoading;
  readonly errorMessage = this.facade.errorMessage;

  currentPage = this.facade.currentPage;
  pageSize = this.facade.pageSize;
  totalPages = this.facade.totalPages;

  pages = computed(() => {
    const count = Math.ceil(this.totalPages() / this.pageSize());
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    if (this.pastExams().length === 0) {
      this.loadResults();
    }
  }

  loadResults(): void {
    this.facade.loadPastExams(this.currentPage(), this.pageSize());
  }

  changePage(page: number): void {
    const total = Math.ceil(this.totalPages() / this.pageSize());
    if (page < 1 || page > total || page === this.currentPage()) return;
    this.facade.loadPastExams(page, this.pageSize());
  }
}
