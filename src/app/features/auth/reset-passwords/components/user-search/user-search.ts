import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ResetPasswordsFacade } from '../../services/reset-passwords-facade';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [FormsModule, CommonModule, IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './user-search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSearch {
  protected readonly facade = inject(ResetPasswordsFacade);

  protected readonly query = this.facade.searchQuery;
  protected readonly isSearching = this.facade.isSearching;
  protected readonly results = this.facade.searchResults;

  protected onSearch(query: string) {
    this.facade.searchUsers(query);
  }
}
