import { Component, input } from '@angular/core';

@Component({
  selector: 'app-past-exams',
  templateUrl: './past-exams.component.html',
  styleUrl: './past-exams.component.css'
})
export class PastExamsComponent {
  exams = input.required<any[]>();
}
