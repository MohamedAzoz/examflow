import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IMyCourse } from '../../../../../data/models/Student/IMyCourse';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-card.html',
  styleUrl: './course-card.css'
})
export class CourseCard {
  course = input.required<IMyCourse>();
}
