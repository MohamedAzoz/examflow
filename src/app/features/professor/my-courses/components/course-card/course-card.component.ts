import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IAssignCourses } from '../../../../../data/models/department/iassign-courses';

type AssignedCourse = IAssignCourses['assignedCourses'][number];

@Component({
  selector: 'app-course-card',
  imports: [CommonModule],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.css',
})
export class CourseCardComponent {
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

  protected resolveIcon(courseId: number): string {
    const icons = [
      'pi-code',
      'pi-desktop',
      'pi-sitemap',
      'pi-shield',
      'pi-sparkles',
      'pi-share-alt',
    ];

    return icons[Math.abs(courseId) % icons.length];
  }
}
