import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-semester-filter',
  imports: [],
  templateUrl: './semester-filter.html',
  styleUrls: ['../../../shard-style.css', './semester-filter.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemesterFilter {
  search = output<string>();
  add = output<void>();

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }

  onAdd(): void {
    this.add.emit();
  }
}
