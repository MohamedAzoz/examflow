import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { UpcomingExamsCardComponent } from '../../components/upcoming-exams-card/upcoming-exams-card';
import { PastExamsCardComponent } from '../../components/past-exams-card/past-exams-card';
import { ActiveExamsCardComponent } from '../../components/active-exams-card/active-exams-card';
// import { DashboardState } from '../../state/dashboard.state';
import { StudentExamFacade } from '../../services/student-exam-facade';

@Component({
  selector: 'app-dashboard',
  imports: [UpcomingExamsCardComponent, PastExamsCardComponent, ActiveExamsCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  // readonly state = inject(DashboardState);
  readonly facade = inject(StudentExamFacade);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void { 
    // Load available exams from API
    this.facade.loadAvailableExams();

    // Start countdown ticker (every second) to force reactivity in facade selectors
    this.intervalId = setInterval(() => {
      this.facade.updateTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
