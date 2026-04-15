import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

export interface CourseOption {
  id: number;
  name: string;
  code: string;
}

@Component({
  selector: 'app-course-transfer-board',
  imports: [ButtonModule, InputTextModule],
  templateUrl: './course-transfer-board.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseTransferBoardComponent {
  readonly availableCourses = input<CourseOption[]>([]);
  readonly assignedCourses = input<CourseOption[]>([]);
  readonly availableSearch = input('');
  readonly assignedSearch = input('');
  readonly disabled = input(false);

  readonly availableSearchChanged = output<string>();
  readonly assignedSearchChanged = output<string>();
  readonly assignOne = output<number>();
  readonly unassignOne = output<number>();
  readonly assignAll = output<void>();
  readonly unassignAll = output<void>();

  protected onAvailableSearch(value: string): void {
    this.availableSearchChanged.emit(value);
  }

  protected onAssignedSearch(value: string): void {
    this.assignedSearchChanged.emit(value);
  }
}
