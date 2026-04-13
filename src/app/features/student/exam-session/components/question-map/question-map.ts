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
      'relative flex aspect-square w-full items-center justify-center rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light';

    if (isMarked) {
      return `${base} border-transparent bg-orange text-text-dark`;
    }

    if (isActive) {
      return `${base} border-primary bg-border-teal text-text-dark shadow-sm`;
    }

    if (isAnswered) {
      return `${base} border-primary bg-primary text-white`;
    }

    return `${base} border-transparent bg-gray text-text-gray hover:brightness-95`;
  }

  questionNumberClass(index: number): string {
    if (this.currentIndex() === index) {
      return 'flex h-[68%] w-[68%] items-center justify-center rounded-[22%] border-2 border-text-secondary text-base font-semibold leading-none md:text-xl';
    }

    return 'text-base font-semibold leading-none md:text-xl';
  }

  submitButtonClass(): string {
    const base = 'mt-5 w-full rounded-lg px-4 py-3 text-xl font-semibold text-white md:mt-6';

    if (this.isDisabled()) {
      return `${base} cursor-not-allowed bg-white-red opacity-60`;
    }

    return `${base} btn cursor-pointer bg-danger hover:brightness-95`;
  }
}
