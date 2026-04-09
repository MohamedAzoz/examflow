import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IDepartmentById } from '../../../../../data/models/department/idepartment-by-id';
import { ProfessorOption } from '../../../services/professor-facade';
import { AssignMode } from '../assign-mode-tabs/assign-mode-tabs';

@Component({
  selector: 'app-assignment-target-selector',
  templateUrl: './assignment-target-selector.html',
  styleUrl: './assignment-target-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentTargetSelectorComponent {
  readonly mode = input.required<AssignMode>();
  readonly professors = input<ProfessorOption[]>([]);
  readonly departments = input<IDepartmentById[]>([]);
  readonly selectedProfessorId = input<string | null>(null);
  readonly selectedDepartmentId = input<number | null>(null);
  readonly disabled = input(false);
 
  readonly professorChanged = output<string>();
  readonly departmentChanged = output<number>();

  protected onProfessorChange(value: string): void {
    if (!value) return;
    this.professorChanged.emit(value);
  }

  protected onDepartmentChange(value: string): void {
    if (!value) return;
    this.departmentChanged.emit(Number(value));
  }
}
