import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UserSearch } from './components/user-search/user-search';
import { ResetForm } from './components/reset-form/reset-form';
import { ResetPasswordsFacade } from './services/reset-passwords-facade';

@Component({
  selector: 'app-reset-passwords',
  standalone: true,
  imports: [UserSearch, ResetForm],
  templateUrl: './reset-passwords.html',
  providers: [ResetPasswordsFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswords {
  protected readonly facade = inject(ResetPasswordsFacade);
  protected readonly selectedUser = this.facade.selectedUser;
}

