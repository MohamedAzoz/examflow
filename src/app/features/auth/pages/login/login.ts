import { Component, inject, signal } from '@angular/core';
import { AuthFacade } from '../../services/auth-facade';
import { Ilogin } from '../../../../data/models/auth/ilogin';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
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
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authFacade.login(this.loginForm.value as Ilogin);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
