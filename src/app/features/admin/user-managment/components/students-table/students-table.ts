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
import { IStudentSearch, IStudentResponse, Student } from '../../../../../data/services/student';
import {
  getInitials,
  getAvatarColor,
  getAvatarText,
} from '../../../../../shared/utils/avatar.util';
import { FilterConfig, FilterModal, FilterResult } from '../filter-modal/filter-modal';
import { DepartmentFacade } from '../../../services/department-facade';
import { AddStudentModal } from '../add-student-modal/add-student-modal';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

interface StudentRow {
  id: string;
  initials: string;
  avatarColor: string;
  avatarText: string;
  fullName: string;
  nationalId: string;
  univCode: string;
  level: number;
  dept: string;
  email: string;
}

@Component({
  selector: 'app-students-table',
  imports: [
    FilterModal,
    AddStudentModal,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './students-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsTable implements OnInit {
  private readonly studentService = inject(Student);
  private readonly departmentService = inject(DepartmentFacade);
  private readonly destroyRef = inject(DestroyRef);

  // State
  protected readonly students = signal<StudentRow[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly pageSize = 5;
  protected readonly loading = signal(false);
  protected readonly showAddModal = signal(false);
  protected readonly showFilter = signal(false);

  // Filter state
  protected readonly sortOption = signal(0);
  protected readonly filterLevel = signal(0);
  protected readonly filterDeptId = signal(0);
  // Filter config for the modal
  protected readonly filterConfig: FilterConfig = {
    title: 'Filter Students',
    sortOptions: [
      { label: 'Name (A-Z)', value: 0 },
      { label: 'Name (Z-A)', value: 1 },
      { label: 'Level (1-4)', value: 2 },
      { label: 'Level (4-1)', value: 3 },
      { label: 'Department (A-Z)', value: 4 },
      { label: 'Department (Z-A)', value: 5 },
    ],
    showAcademicLevel: true,
    academicLevels: [1, 2, 3, 4],
    showDepartment: true,
    departments: this.departmentService.departments(),
  };

  // Computed
  protected readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize) || 1);

  protected readonly showingFrom = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1,
  );

  protected readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.totalCount()),
  );

  ngOnInit(): void {
    this.loadStudents();
    this.departmentService.getDepartments();
  }

  protected onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.loadStudents();
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadStudents(this.currentPage());
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadStudents(this.currentPage());
    }
  }

  protected toggleFilter(): void {
    this.showFilter.update((v) => !v);
  }

  protected onFilterApply(result: FilterResult): void {
    this.sortOption.set(result.sortOption);
    this.filterLevel.set(result.academicLevel ?? 0);
    this.filterDeptId.set(result.departmentId ?? 0);
    this.currentPage.set(1);
    this.showFilter.set(false);
    this.loadStudents(this.currentPage());
  }

  protected onFilterReset(): void {
    this.sortOption.set(0);
    this.filterLevel.set(0);
    this.filterDeptId.set(0);
    this.currentPage.set(1);
    this.showFilter.set(false);
    this.loadStudents();
  }

  protected onUploadExcel(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      this.loading.set(true);
      this.studentService
        .importStudents(file)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadStudents();
          },
          error: (err) => {
            console.error('Import failed:', err);
            this.loading.set(false);
          },
        });
    };

    input.click();
  }

  protected onStudentAdded(): void {
    this.showAddModal.set(false);
    this.currentPage.set(1);
    this.loadStudents(this.currentPage());
  }

  protected editStudent(student: StudentRow): void {
    // TODO: implement edit
    console.log('Edit student:', student.id);
  }

  protected deleteStudent(student: StudentRow): void {
    // TODO: implement delete
    console.log('Delete student:', student.id);
  }

  protected trackByStudentId(_: number, student: StudentRow): string {
    return student.id;
  }

  protected getLevelClass(level: number): string {
    const base = 'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold';

    switch (level) {
      case 1:
        return `${base} bg-violet-100 text-violet-700`;
      case 2:
        return `${base} bg-emerald-100 text-emerald-700`;
      case 3:
        return `${base} bg-sky-100 text-sky-700`;
      case 4:
        return `${base} bg-pink-100 text-pink-700`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  }

  private loadStudents(pageIndex: number = 1): void {
    this.loading.set(true);

    const search: IStudentSearch = {
      nameSearch: this.searchQuery(),
      departmentId: this.filterDeptId(),
      academicLevel: this.filterLevel(),
      studentSortingOption: this.sortOption(),
      pageSize: this.pageSize,
      pageIndex: pageIndex,
    };

    this.studentService
      .getAllStudents(search)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: IStudentResponse) => {
          const items = res.data;
          const total: number = res.totalSize;
          this.students.set(
            items.map((s, index) => {
              return {
                id: s.id,
                initials: getInitials(s.fullName),
                avatarColor: getAvatarColor(index),
                avatarText: getAvatarText(index),
                fullName: s.fullName,
                nationalId: s.nationalId,
                univCode: s.universityCode,
                level: s.academicLevel,
                dept: s.departmentCode,
                email: s.email,
              };
            }),
          );
          this.totalCount.set(total);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load students:', err);
          this.loading.set(false);
        },
      });
  }
}
