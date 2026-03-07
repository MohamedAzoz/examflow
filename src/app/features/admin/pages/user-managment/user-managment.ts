import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ProfessorsTable } from '../../components/user management/professors-table/professors-table';
import { StudentsTable } from '../../components/user management/students-table/students-table';
import { TabType } from '../../../../shared/models/table';
import { AdminsTableComponent } from '../../components/user management/admins-table/admins-table';

@Component({
  selector: 'app-user-management',
  imports: [StudentsTable, ProfessorsTable, AdminsTableComponent],
  templateUrl: './user-managment.html',
  styleUrl: './user-managment.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent {
  protected readonly activeTab = signal<TabType>('Students');
  protected readonly tabs: readonly TabType[] = ['Students', 'Professors', 'Admins'];

  protected setTab(tab: TabType): void {
    this.activeTab.set(tab);
  }
}
