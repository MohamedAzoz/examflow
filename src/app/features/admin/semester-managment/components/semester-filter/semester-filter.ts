import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-semester-filter',
  imports: [ButtonModule, InputTextModule, IconFieldModule, InputIconModule],
  templateUrl: './semester-filter.html',
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
