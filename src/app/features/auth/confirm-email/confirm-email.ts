import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AUTH_ROUTES, ROUTES } from '../../../core/constants/const.route';
import { Theme } from '../../../core/services/theme';
import { IconfirmEmail } from '../../../data/models/auth/IconfirmEmail';
import { AuthFacade } from '../services/auth-facade';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, NgOptimizedImage],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.css',
})
export class ConfirmEmail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly authFacade = inject(AuthFacade);
  private readonly theme = inject(Theme);

  readonly routes = ROUTES;
  readonly authRoutes = AUTH_ROUTES;

  readonly state = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly message = signal('');

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly confirmationPayload = computed<IconfirmEmail | null>(() => {
    let token = this.queryParams().get('token') ?? '';
    const userId = this.queryParams().get('userId')?.trim() ?? '';
    const newEmail =
      this.queryParams().get('newEmail')?.trim() || this.queryParams().get('email')?.trim() || '';

    if (!token || !userId || !newEmail) {
      return null;
    }

    return {
      token,
      userId,
      newEmail,
    };
  });

  constructor() {
    this.theme.setForceLightMode(true);
  }

  ngOnInit(): void {
    const payload = this.confirmationPayload();

    if (!payload) {
      this.state.set('error');
      this.message.set('This confirmation link is invalid or incomplete.');
      return;
    }

    this.state.set('loading');

    this.authFacade.confirmEmail(
      payload,
      () => {
        this.state.set('success');
        this.message.set(
          'Your email has been verified successfully. You can now continue using your account.',
        );
      },
      (errorMessage) => {
        this.state.set('error');
        this.message.set(errorMessage || 'Email verification failed.');
      },
    );
  }

  ngOnDestroy(): void {
    this.theme.setForceLightMode(false);
  }
}
