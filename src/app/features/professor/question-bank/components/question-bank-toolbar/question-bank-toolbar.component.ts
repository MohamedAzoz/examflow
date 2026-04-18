import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-question-bank-toolbar',
  standalone: true,
  templateUrl: './question-bank-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBankToolbarComponent {
  readonly searchValue = input('');
  readonly filterCount = input(0);
  readonly disabled = input(false);

  readonly searchChanged = output<string>();
  readonly filterClicked = output<void>();
  readonly importClicked = output<void>();
  readonly createClicked = output<void>();

  onSearchInput(value: string): void {
    this.searchChanged.emit(value);
  }

  onOpenFilter(): void {
    this.filterClicked.emit();
  }

  onOpenImport(): void {
    this.importClicked.emit();
  }

  onOpenCreate(): void {
    this.createClicked.emit();
  }
}
