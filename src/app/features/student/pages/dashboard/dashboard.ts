import { Component, inject, OnInit } from '@angular/core';
import { StudentExamFacade } from '../../services/student-exam-facade';
import { Toggle } from '../../../../core/services/toggle';
import { StudentSidebarComponent } from '../../../../layout/student-sidebar/student-sidebar.component';
import { UpcomingExamsComponent } from '../../components/upcoming-exams/upcoming-exams.component';
import { PastExamsComponent } from '../../components/past-exams/past-exams.component';
import { ActiveExamsComponent } from '../../components/active-exams/active-exams.component';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [StudentSidebarComponent, UpcomingExamsComponent, PastExamsComponent, ActiveExamsComponent]
})
export class DashboardComponent implements OnInit {
  public facade = inject(StudentExamFacade);
  public toggle = inject(Toggle);

  ngOnInit() {
    this.facade.loadAvailableExams();
  }

  onJoinExam(examId: number) {
    this.facade.startExam(examId);
  }
}
