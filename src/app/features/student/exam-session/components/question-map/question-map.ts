import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';

@Component({
  selector: 'app-question-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './question-map.html',
  styleUrl: './question-map.css',  
})
export class QuestionMapComponent {
  readonly questionIds = input.required<number[]>();
  readonly currentIndex = input.required<number>();
  readonly answeredIds = input.required<Record<number, any>>();
  readonly markedIds = input.required<Record<number, boolean>>();
  readonly errorMessage = input<string | null>(null);
  readonly availableTimeToStart = input<number>(0);

  readonly jumpTo = output<number>();
  readonly submit = output<void>();
  readonly isDisabled = computed(
    () => this.availableTimeToStart() > 0,
  );
}
