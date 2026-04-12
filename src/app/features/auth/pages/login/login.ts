import { Component, inject, signal } from '@angular/core';
import { AuthFacade } from '../../services/auth-facade';
import { Ilogin } from '../../../../data/models/auth/ilogin';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageModule } from 'primeng/message';

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
    MessageModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  public authFacade = inject(AuthFacade);

  showPassword = signal(false);

  loginForm = new FormGroup({
    identifier: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

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
