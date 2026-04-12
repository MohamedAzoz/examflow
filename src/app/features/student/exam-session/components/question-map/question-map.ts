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
  readonly isDisabled = computed(() => this.availableTimeToStart() > 0);

  questionButtonClass(questionId: number, index: number): string {
    const isActive = this.currentIndex() === index;
    const isMarked = !!this.markedIds()[questionId];
    const isAnswered = !!this.answeredIds()[questionId];
    const base =
      'relative flex aspect-square w-full items-center justify-center rounded-md border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]';

    if (isMarked) {
      return `${base} border-transparent bg-[var(--color-orange)] text-[var(--color-text-dark)]`;
    }

    if (isActive) {
      return `${base} border-[var(--color-primary)] bg-[var(--color-border-teal)] text-[var(--color-text-gray)] shadow-[inset_0_0_0_2px_var(--color-primary)]`;
    }

    if (isAnswered) {
      return `${base} border-transparent bg-[var(--color-primary)] text-white`;
    }

    return `${base} border-transparent bg-[var(--color-gray)] text-[var(--color-text-gray)] hover:brightness-95`;
  }

  questionNumberClass(index: number): string {
    if (this.currentIndex() === index) {
      return 'flex h-[68%] w-[68%] items-center justify-center rounded-[20%] border-2 border-[var(--color-text-gray)] text-base font-semibold leading-none md:text-xl';
    }

    return 'text-base font-semibold leading-none md:text-xl';
  }
}
