import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-course-filter',
  imports: [],
  templateUrl: './course-filter.html', 
  styleUrls: ['../../../shard-style.css', './course-filter.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseFilter {
  @Output() search = new EventEmitter<string>();
  @Output() add = new EventEmitter<void>();

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }

  onAdd(): void {
    this.add.emit();
  }
}
