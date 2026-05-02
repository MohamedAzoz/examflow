import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentFacade } from '../services/student-facade';
import { CourseCard } from './components/course-card/course-card';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, CourseCard], 
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  private readonly studentFacade = inject(StudentFacade);

  readonly coursesResource = this.studentFacade.enrolledCoursesResource;

  ngOnInit(): void {
    this.studentFacade.loadEnrolledCourses();
  }
}
