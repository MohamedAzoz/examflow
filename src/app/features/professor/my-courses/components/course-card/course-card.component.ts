import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IAssignCourses } from '../../../../../data/models/department/iassign-courses';
import { ROUTES, ROUTESPROFESSOR } from '../../../../../core/constants/const.route';

type AssignedCourse = IAssignCourses['assignedCourses'][number];

@Component({
  selector: 'app-course-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './course-card.component.html',
  styleUrl: './course-card.component.css',
})
export class CourseCardComponent {
  @Input({ required: true }) course!: AssignedCourse;

  protected readonly routes = ROUTES;
  protected readonly professorRoutes = ROUTESPROFESSOR;

  protected resolveLevelLabel(): string {
    const level = this.course.academicLevel;
    if (!level) {
      return 'Level 1';
    }

    if (!Number.isFinite(level) || level < 1 || level > 5) {
      return 'Level 1';
    }

    return `Level ${level}`;
  }

  protected resolveIcon(courseId: number): string {
    const icons = ['pi-code', 'pi-desktop', 'pi-sitemap', 'pi-shield', 'pi-sparkles'];

    return icons[Math.abs(courseId) % icons.length];
  }
}
