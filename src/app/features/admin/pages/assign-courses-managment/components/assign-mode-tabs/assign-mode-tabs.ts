import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AssignMode = 'professor' | 'department';

@Component({
  selector: 'app-assign-mode-tabs',
  templateUrl: './assign-mode-tabs.html',
  styleUrl: './assign-mode-tabs.css',
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
