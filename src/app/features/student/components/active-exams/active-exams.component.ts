import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-active-exams',
  templateUrl: './active-exams.component.html',
  styleUrl: './active-exams.component.css'
})
export class ActiveExamsComponent {
  exams = input.required<any[]>();
  joinExam = output<number>();

  onJoinExam(examId: number) {
    this.joinExam.emit(examId);
  }
}
