import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IProfessorResponse, Professor } from '../../../../../data/services/professor';
import { FilterConfig, FilterModal, FilterResult } from '../filter-modal/filter-modal';
import {
  getInitials,
  getAvatarColor,
  getAvatarText,
  getJobColor,
  getJobText,
} from '../../../../../shared/utils/avatar.util';
import { AddProfessorModalComponent } from '../add-professor-modal/add-professor-modal';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
/*
 "id": "32aed284-65e2-43ca-d542-08de77577cb6",
      "nationalId": "12345678910112",
      "fullName": "د. احمد على",
      "universityCode": "10234",
      "academicRank": "Professor",
      "email": "Ah.professor@examflow.edu.eg",
      "phoneNumber": "+201012354678"
*/
interface ProfessorRow {
  id: string;
  initials: string;
  avatarColor: string;
  avatarText: string;
  fullName: string;
  nationalId: string;
  email: string;
  phone: string;
  academicRank: string;
  academicRankColor: string;
  academicRankText: string;
  universityCode: string;
}

@Component({
  selector: 'app-professors-table',
  imports: [
    FilterModal,
    AddProfessorModalComponent,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './professors-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorsTable implements OnInit {
  private readonly professorService = inject(Professor);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly professors = signal<ProfessorRow[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly pageSize = 5;
  protected readonly loading = signal(false);
  protected readonly showAddModal = signal(false);
  protected readonly showFilter = signal(false);
  protected readonly sortOption = signal(0);

  protected readonly filterConfig: FilterConfig = {
    title: 'Filter Professors',
    sortOptions: [
      { label: 'Name (A-Z)', value: 0 },
      { label: 'Name (Z-A)', value: 1 },
    ],
    showAcademicLevel: false,
    academicLevels: [],
    showDepartment: false,
    departments: [],
  };

  protected readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize) || 1);

  protected readonly showingFrom = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1,
  );

  protected readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.totalCount()),
  );

  ngOnInit(): void {
    this.loadProfessors();
  }

  protected onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.loadProfessors();
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadProfessors();
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadProfessors();
    }
  }

  protected toggleFilter(): void {
    this.showFilter.update((v) => !v);
  }

  protected onFilterApply(result: FilterResult): void {
    this.sortOption.set(result.sortOption);
    this.currentPage.set(1);
    this.showFilter.set(false);
    this.loadProfessors();
  }

  protected onFilterReset(): void {
    this.sortOption.set(0);
    this.currentPage.set(1);
    this.showFilter.set(false);
    this.loadProfessors();
  }

  protected onUploadExcel(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      this.loading.set(true);
      this.professorService
        .importProfessors(file)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.loadProfessors(),
          error: (err) => {
            console.error('Import failed:', err);
            this.loading.set(false);
          },
        });
    };

    input.click();
  }

  protected onProfessorAdded(): void {
    this.showAddModal.set(false);
    this.currentPage.set(1);
    this.loadProfessors();
  }

  protected editProfessor(prof: ProfessorRow): void {
    console.log('Edit professor:', prof.id);
  }

  protected deleteProfessor(prof: ProfessorRow): void {
    console.log('Delete professor:', prof.id);
  }

  protected trackByProfessorId(_: number, professor: ProfessorRow): string {
    return professor.id;
  }

  private loadProfessors(): void {
    this.loading.set(true);

    this.professorService
      .getAllProfessors(this.searchQuery(), this.sortOption(), this.pageSize, this.currentPage())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: IProfessorResponse) => {
          const items = res.data;
          const total: number = res.totalSize;

          this.professors.set(
            items.map((p: any, index: number) => ({
              id: p.id,
              initials: getInitials(p.fullName),
              avatarColor: getAvatarColor(index),
              avatarText: getAvatarText(index),
              fullName: p.fullName,
              nationalId: p.nationalId ?? '',
              email: p.email ?? '',
              phone: p.phoneNumber ?? '',
              academicRank: p.academicRank ?? '',
              academicRankColor: getJobColor(index),
              academicRankText: getJobText(index),
              universityCode: p.universityCode ?? '',
            })),
          );
          this.totalCount.set(total);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load professors:', err);
          this.loading.set(false);
        },
      });
  }
}
