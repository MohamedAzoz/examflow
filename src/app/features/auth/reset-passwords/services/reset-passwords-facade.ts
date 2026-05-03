import { inject, Injectable, signal, OnDestroy } from '@angular/core';
import { IUserFoundResponse } from '../../../../data/models/admin/IUserFoundResponse';
import { firstValueFrom, Subject, switchMap, catchError, tap, takeUntil, EMPTY } from 'rxjs';
import { Admin } from '../../../../data/services/admin';
import { AppMessageService } from '../../../../core/services/app-message';

@Injectable()
export class ResetPasswordsFacade implements OnDestroy {
  private readonly adminService = inject(Admin);
  private readonly message = inject(AppMessageService);

  readonly searchResults = signal<IUserFoundResponse[]>([]);
  readonly isSearching = signal(false);
  readonly selectedUser = signal<IUserFoundResponse | null>(null);
  readonly isResetting = signal(false);
  readonly searchQuery = signal('');

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.searchSubject
      .pipe(
        takeUntil(this.destroy$),
        tap((query) => {
          this.searchQuery.set(query);
          if (!query || query.trim().length < 2) {
            this.searchResults.set([]);
            this.isSearching.set(false);
          } else {
            this.isSearching.set(true);
          }
        }),
        switchMap((query) => {
          const isNumeric = /^\d+$/.test(query.trim());
          const payload = isNumeric ? { universityCode: query.trim() } : { name: query.trim() };

          return this.adminService.userSearch(payload).pipe(
            catchError(() => {
              this.message.addErrorMessage('Failed to search users. Please try again.');
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe((results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });
  }

  searchUsers(query: string) {
    this.searchSubject.next(query);
  }

  selectUser(user: IUserFoundResponse) {
    this.selectedUser.set(user);
  }

  clearSelection() {
    this.selectedUser.set(null);
  }

  async resetPassword(newPassword: string): Promise<boolean> {
    const user = this.selectedUser();
    if (!user) return false;

    this.isResetting.set(true);
    try {
      await firstValueFrom(
        this.adminService.resetPassword({
          userId: user.id,
          newPassword,
        }),
      );
      this.message.addSuccessMessage(`Password for ${user.fullName} has been reset successfully.`);
      this.clearSelection();
      this.searchSubject.next('');
      this.searchResults.set([]);
      return true;
    } catch {
      this.message.addErrorMessage('Failed to reset password. Please try again.');
      return false;
    } finally {
      this.isResetting.set(false);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
