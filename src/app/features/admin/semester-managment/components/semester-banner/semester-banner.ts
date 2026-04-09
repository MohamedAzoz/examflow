import { Component, inject, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SemesterFacade } from '../../../services/semester-facade';
import { ISemesterResponse } from '../../../../../data/models/semester/isemester-response';

@Component({
  selector: 'app-semester-banner',
  imports: [DatePipe],
  templateUrl: './semester-banner.html',
  styleUrl: './semester-banner.css',
})
export class SemesterBanner {
  readonly activeSemester = input.required<ISemesterResponse | undefined>();
  readonly isLoading = input.required<boolean | undefined>();
}
