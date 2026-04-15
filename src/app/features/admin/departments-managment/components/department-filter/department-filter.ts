import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-department-filter',
  standalone: true,
  imports: [ButtonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './department-filter.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentFilter {
  readonly search = output<string>();
  readonly add = output<void>();

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }

  protected onAdd(): void {
    this.add.emit();
  }
}
