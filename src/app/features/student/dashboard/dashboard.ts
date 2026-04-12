import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentExamFacade } from '../services/student-exam-facade';
import { ActiveExamsCardComponent } from './components/active-exams-card/active-exams-card';
import { PastExamsCardComponent } from './components/past-exams-card/past-exams-card';
import { UpcomingExamsCardComponent } from './components/upcoming-exams-card/upcoming-exams-card';
import { IdentityService } from '../../../core/services/identity-service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    UpcomingExamsCardComponent,
    PastExamsCardComponent,
    ActiveExamsCardComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  readonly facade = inject(StudentExamFacade);
  readonly identity = inject(IdentityService);

  protected readonly today = new Date();

  ngOnInit(): void {
    this.facade.loadAvailableExams();
    this.facade.loadPastExams(1, 3);
  }
}