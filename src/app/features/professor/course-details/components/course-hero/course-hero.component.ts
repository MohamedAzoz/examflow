import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { ICoueseResponse } from '../../../../../data/models/course/icouese-response';

@Component({
  selector: 'app-course-hero',
  imports: [CommonModule],
  templateUrl: './course-hero.component.html',
  styleUrl: './course-hero.component.css',
})
export class CourseHeroComponent {
  course = input.required<ICoueseResponse>();
  protected resolveLevelLabel(): string {
    const level = this.course().academicLevel;
    if (!level) {
      return 'Level 1';
    }

    if (!Number.isFinite(level) || level < 1 || level > 5) {
      return 'Level 1';
    }

    return `Level ${level}`;
  }
}
