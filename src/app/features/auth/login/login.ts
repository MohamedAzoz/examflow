import { Component, inject, OnDestroy, signal } from '@angular/core';
import { AuthFacade } from '../services/auth-facade';
import { Ilogin } from '../../../data/models/auth/ilogin';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';
import { Theme } from '../../../core/services/theme';
import { AUTH_ROUTES } from '../../../core/constants/const.route';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    IconFieldModule,
    InputIconModule,
    NgOptimizedImage,
    MessageModule,
    RouterModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnDestroy {
  public authFacade = inject(AuthFacade);
  private readonly theme = inject(Theme);
  readonly routes = AUTH_ROUTES;

  showPassword = signal(false);

  loginForm = new FormGroup({
    identifier: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  constructor() {
    this.theme.setForceLightMode(true);
  }

  ngOnDestroy(): void {
    this.theme.setForceLightMode(false);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const body: Ilogin = {
        identifier: this.loginForm.value.identifier?.trim() || '',
        password: this.loginForm.value.password?.trim() || '',
      };
      this.authFacade.login(body);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
