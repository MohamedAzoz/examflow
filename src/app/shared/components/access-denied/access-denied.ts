import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  imports: [],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.css',
})
export class AccessDenied {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  goBack(): void {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}