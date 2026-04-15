import {
  Component,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { SemesterFacade } from '../services/semester-facade';
import { SemesterBanner } from './components/semester-banner/semester-banner';
import { SemesterFilter } from './components/semester-filter/semester-filter';
import { SemesterTable } from './components/semester-table/semester-table';
import { SemesterModal } from './components/semester-modal/semester-modal';

@Component({
  selector: 'app-semester-managment',
  imports: [SemesterBanner, SemesterFilter, SemesterTable, SemesterModal],
  templateUrl: './semester-managment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemesterManagment {
  public readonly semesterFacade = inject(SemesterFacade);

  protected readonly showModal = signal(false);

  constructor() {
    // Open modal if a semester is selected for editing
    effect(() => {
      if (this.semesterFacade.selectedSemester()) {
        this.showModal.set(true);
      }
    });
  }

  protected readonly activeSemester = computed(() => {
    const list = this.semesterFacade.activeSemestersResource.value();
    return list;
  });

  protected readonly isLoading = computed(() =>
    this.semesterFacade.activeSemestersResource.isLoading(),
  );

  protected onAddSemester(): void {
    this.semesterFacade.selectedSemester.set(null);
    this.showModal.set(true);
  }

  protected onSearch(query: string): void {
    const filtered = this.semesterFacade.allSemestersResource
      .value()
      ?.filter((semester) => semester.name.toLowerCase().includes(query.toLowerCase()));
    this.semesterFacade.allSemestersResource.set(filtered);
  }

  protected onModalClosed(): void {
    this.showModal.set(false);
  }
}
