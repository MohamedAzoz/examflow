import { Component, input } from '@angular/core';

@Component({
  selector: 'app-upcoming-exams',
  templateUrl: './upcoming-exams.component.html',
  styleUrl: './upcoming-exams.component.css'
})
export class UpcomingExamsComponent {
  exams = input.required<any[]>();
}
