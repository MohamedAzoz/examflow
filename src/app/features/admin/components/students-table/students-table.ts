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
import { NgClass } from '@angular/common';
import { IStudentSearch, IStudentResponse, Student } from '../../../../data/services/student';
import { getInitials, getAvatarColor, getAvatarText } from '../../../../shared/utils/avatar.util';
import { AddStudentModal } from '../add-student-modal/add-student-modal';
import { FilterConfig, FilterModal, FilterResult } from '../filter-modal/filter-modal';

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
  imports: [NgClass, FilterModal, AddStudentModal],
  templateUrl: './students-table.html',
  styleUrls: ['../shard-style.css', './students-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsTable implements OnInit {
  private readonly studentService = inject(Student);
  private readonly destroyRef = inject(DestroyRef);

  // State
  protected readonly students = signal<StudentRow[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly pageSize = 5;
  protected readonly index = signal(0);
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
    departments: [
      { id: 1, code: 'CS' },
      { id: 2, code: 'IT' },
      { id: 3, code: 'IS' },
      { id: 4, code: 'DS' },
      { id: 5, code: 'CK' },
    ],
  };

  // Computed
  protected readonly totalPages = computed(
    () => Math.ceil(this.totalCount() / this.pageSize) || 1,
  );

  protected readonly showingFrom = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1,
  );

  protected readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.totalCount()),
  );

  ngOnInit(): void {
    this.loadStudents();
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

  protected getLevelClass(level: number): string {
    return `badge-level-${level}`;
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
          // Adapt response — adjust based on actual API shape
          const items = res.data;
          const total: number = res.totalSize;
          this.students.set(
            items.map((s) => {
              this.index.set(this.index() + 1);
              return {
              id: s.id,
              initials: getInitials(s.fullName),
              avatarColor: getAvatarColor(this.index()),
              avatarText: getAvatarText(this.index()),
              fullName: s.fullName,
              nationalId: s.nationalId,
              univCode: s.universityCode,
              level: s.academicLevel,
              dept: s.departmentCode,
              email: s.email,
            }}),
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
