import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ISemesterResponse } from '../../../../../data/models/semester/isemester-response';

@Component({
  selector: 'app-semester-banner',
  imports: [DatePipe],
  templateUrl: './semester-banner.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemesterBanner {
  readonly activeSemester = input.required<ISemesterResponse | undefined>();
  readonly isLoading = input.required<boolean | undefined>();
}
