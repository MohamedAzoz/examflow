import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IAssignCourses } from '../../../../../data/models/department/iassign-courses';

type AssignedCourse = IAssignCourses['assignedCourses'][number];

@Component({
  selector: 'app-course-hero',
  imports: [CommonModule],
  templateUrl: './course-hero.component.html',
  styleUrl: './course-hero.component.css',
})
export class CourseHeroComponent {
  @Input({ required: true }) course!: AssignedCourse;

  protected resolveLevelLabel(courseCode: string): string {
    const digits = courseCode.replace(/\D/g, '');
    if (!digits) {
      return 'Level 1';
    }

    const level = Number(digits.charAt(0));
    if (!Number.isFinite(level) || level < 1 || level > 6) {
      return 'Level 1';
    }

    return `Level ${level}`;
  }
}
