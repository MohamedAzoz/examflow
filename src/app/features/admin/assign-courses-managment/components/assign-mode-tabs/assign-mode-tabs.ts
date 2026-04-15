import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AssignMode = 'professor' | 'department';

@Component({
  selector: 'app-assign-mode-tabs',
  standalone: true,
  templateUrl: './assign-mode-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignModeTabsComponent {
  readonly mode = input.required<AssignMode>();
  readonly modeChanged = output<AssignMode>();

  protected setMode(mode: AssignMode): void {
    if (mode === this.mode()) return;
    this.modeChanged.emit(mode);
  }
}
