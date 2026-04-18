import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

export interface QuestionImportPayload {
  courseId: number;
  file: File;
}

@Component({
  selector: 'app-question-import-modal',
  standalone: true,
  templateUrl: './question-import-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionImportModalComponent {
  readonly visible = input(false);
  readonly importing = input(false);
  readonly courseId = input(0);

  readonly closeModal = output<void>();
  readonly importQuestions = output<QuestionImportPayload>();

  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal(false);
  readonly localError = signal<string | null>(null);

  readonly canImport = computed(() => {
    return !this.importing() && !!this.selectedFile() && this.courseId() > 0;
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }

      this.localError.set(null);
      this.selectedFile.set(null);
      this.isDragging.set(false);
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.onClose();
  }

  onClose(): void {
    if (this.importing()) {
      return;
    }

    this.closeModal.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    this.acceptFile(file);

    if (input) {
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0] ?? null;
    this.acceptFile(file);
  }

  onProcessImport(): void {
    if (!this.canImport()) {
      return;
    }

    const file = this.selectedFile();

    if (!file) {
      return;
    }

    this.importQuestions.emit({
      courseId: this.courseId(),
      file,
    });
  }

  private acceptFile(file: File | null): void {
    this.localError.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    if (!this.isExcelFile(file.name)) {
      this.selectedFile.set(null);
      this.localError.set('Only Excel files (.xlsx or .xls) are supported.');
      return;
    }

    this.selectedFile.set(file);
  }

  private isExcelFile(fileName: string): boolean {
    const normalized = fileName.toLowerCase();
    return normalized.endsWith('.xlsx') || normalized.endsWith('.xls');
  }
}
