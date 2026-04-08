import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { StudentExamFacade } from '../services/student-exam-facade';
import { ActiveExamsCardComponent } from './components/active-exams-card/active-exams-card';
import { PastExamsCardComponent } from './components/past-exams-card/past-exams-card';
import { UpcomingExamsCardComponent } from './components/upcoming-exams-card/upcoming-exams-card';

@Component({
  selector: 'app-dashboard',
  imports: [UpcomingExamsCardComponent, PastExamsCardComponent, ActiveExamsCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  readonly facade = inject(StudentExamFacade);

  ngOnInit(): void {
    this.facade.loadAvailableExams();
    this.facade.loadPastExams(1, 3);
  }
}