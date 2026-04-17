import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-feature-action-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-action-card.component.html',
  styleUrl: './feature-action-card.component.css',
})
export class FeatureActionCardComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input({ required: true }) buttonLabel!: string;
  @Input() buttonVariant: 'primary' | 'outline' = 'primary';
  @Input() disabled = false;

  @Output() action = new EventEmitter<void>();

  protected onActionClick(): void {
    if (this.disabled) {
      return;
    }

    this.action.emit();
  }

  protected buttonClasses(): string {
    if (this.buttonVariant === 'outline') {
      return 'border border-primary bg-transparent text-primary hover:bg-primary/5';
    }

    return 'bg-primary text-white hover:brightness-95';
  }
}
