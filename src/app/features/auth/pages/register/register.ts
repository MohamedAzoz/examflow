import { Component, inject } from '@angular/core';
import { AuthFacade } from '../../services/auth-facade';
import { Iregister, userType } from '../../../../data/models/auth/iregister';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  public authFacade = inject(AuthFacade);

  form = new FormGroup({
    fullName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    nationalId: new FormControl('', [Validators.required]),
    phoneNumber: new FormControl('', [Validators.required]),
    universityCode: new FormControl('', [Validators.required]),
    jobTitle: new FormControl('', [Validators.required]),
    academicRank: new FormControl('', [Validators.required]),
    academicLevel: new FormControl(1, [Validators.required]),
    departmentId: new FormControl(1, [Validators.required]),
    userType: new FormControl(userType.Student, [Validators.required]),
  });

  onSubmit() {
    if (this.form.valid) {
      this.authFacade.register(this.form.value as Iregister);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
