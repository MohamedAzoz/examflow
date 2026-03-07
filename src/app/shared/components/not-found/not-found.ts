import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {
  // حقن خدمة Location للرجوع للخلف
  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}