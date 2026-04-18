import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Theme } from '../../../core/services/theme';
import { AuthFacade } from '../services/auth-facade';

@Component({
  selector: 'app-request-email',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    NgOptimizedImage,
  ],
  templateUrl: './request-email.html',
  styleUrl: './request-email.css',
})
export class RequestEmail implements OnDestroy {
  readonly authFacade = inject(AuthFacade);
  private readonly theme = inject(Theme);

  readonly isSubmitted = signal(false);
  readonly submittedEmail = signal('');

  readonly form = new FormGroup({
    newEmail: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    this.theme.setForceLightMode(true);
  }

  ngOnDestroy(): void {
    this.theme.setForceLightMode(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const newEmail = this.form.controls.newEmail.value?.trim() ?? '';
    if (!newEmail) {
      this.form.markAllAsTouched();
      return;
    }

    this.authFacade.requestEmail(newEmail, () => {
      this.submittedEmail.set(newEmail);
      this.isSubmitted.set(true);
    });
  }
}
