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
import { FilterConfig, FilterModal, FilterResult } from '../filter-modal/filter-modal';
import { Admin, IAdminSearch } from '../../../../data/services/admin';
import { getInitials, getAvatarColor } from '../../../../shared/utils/avatar.util';
import { AddAdminModalComponent } from "../add-admin-modal/add-admin-modal";

interface AdminRow {
  id: string;
  initials: string;
  avatarColor: string;
  fullName: string;
  nationalId: string;
  univCode: string;
  jobTitle: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-admins-table',
  imports: [FilterModal, AddAdminModalComponent],
  templateUrl: './admins-table.html',
  styleUrls:['../shard-style.css', './admins-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminsTableComponent implements OnInit {
  private readonly adminService = inject(Admin);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly admins = signal<AdminRow[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly totalCount = signal(0);
  protected readonly pageSize = 2;
  protected readonly loading = signal(false);
  protected readonly showAddModal = signal(false);
  protected readonly showFilter = signal(false);
  protected readonly sortOption = signal(0);

  protected readonly filterConfig: FilterConfig = {
    title: 'Filter Admins',
    sortOptions: [
      { label: 'Name (A-Z)', value: 0 },
      { label: 'Name (Z-A)', value: 1 },
    ],
    showAcademicLevel: false,
    academicLevels: [],
    showDepartment: false,
    departments: [],
  };

  protected readonly totalPages = computed(() =>
    Math.ceil(this.totalCount() / this.pageSize) || 1
  );

  protected readonly showingFrom = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1
  );

  protected readonly showingTo = computed(() =>
    Math.min(this.currentPage() * this.pageSize, this.totalCount())
  );

  ngOnInit(): void {
    this.loadAdmins();
  }

  protected onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.loadAdmins();
  }

  protected prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadAdmins();
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadAdmins();
    }
  }

  protected toggleFilter(): void {
    this.showFilter.update((v) => !v);
  }

  protected onFilterApply(result: FilterResult): void {
    this.sortOption.set(result.sortOption);
    this.currentPage.set(1);
    this.showFilter.set(false);
    this.loadAdmins();
  }

  protected onFilterReset(): void {
    this.sortOption.set(0);
    this.currentPage.set(1);
    this.showFilter.set(false);
    this.loadAdmins();
  }

  protected onUploadExcel(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      this.loading.set(true);
      this.adminService
        .importAdmins(file)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.loadAdmins(),
          error: (err) => {
            console.error('Import failed:', err);
            this.loading.set(false);
          },
        });
    };

    input.click();
  }

  protected onAdminAdded(): void {
    this.showAddModal.set(false);
    this.currentPage.set(1);
    this.loadAdmins();
  }

  protected editAdmin(admin: AdminRow): void {
    console.log('Edit admin:', admin.id);
  }

  protected deleteAdmin(admin: AdminRow): void {
    console.log('Delete admin:', admin.id);
  }

  private loadAdmins(): void {
    this.loading.set(true);

    const search: IAdminSearch = {
      nameSearch: this.searchQuery(),
      adminSortingOption: this.sortOption(),
      pageIndex: this.currentPage(),
      pageSize: this.pageSize,
    };

    this.adminService
      .getAllAdmins(search)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const items = res.data ?? res.items ?? res;
          const total: number = res.totalCount ?? res.total ?? items.length;

          this.admins.set(
            items.map((a: any) => ({
              id: a.id,
              initials: getInitials(a.fullName),
              avatarColor: getAvatarColor(a.fullName),
              fullName: a.fullName,
              nationalId: a.nationalId ?? '',
              univCode: a.universityCode ?? '',
              jobTitle: a.jobTitle ?? '',
              email: a.email ?? '',
              phone: a.phoneNumber ?? '',
            }))
          );
          this.totalCount.set(total);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load admins:', err);
          this.loading.set(false);
        },
      });
  }
}