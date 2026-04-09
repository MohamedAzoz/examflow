import {
  Component,
  OnInit,
  inject,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SemesterFacade } from '../../../services/semester-facade';
import { ISemesterRequest } from '../../../../../data/models/semester/isemester-request';
import { ISemesterResponse } from '../../../../../data/models/semester/isemester-response';

@Component({
  selector: 'app-semester-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './semester-modal.html',
  styleUrls: ['../../../shard-model.css', './semester-modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemesterModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  public readonly semesterFacade = inject(SemesterFacade);

  closed = output<void>();

  protected semesterForm!: FormGroup;
  protected isEditMode = false;

  ngOnInit(): void {
    const selected = this.semesterFacade.selectedSemester();
    this.isEditMode = !!selected;

    this.semesterForm = this.fb.group(
      {
        name: [selected?.name || '', [Validators.required, Validators.minLength(3)]],
        startDate: [
          selected?.startDate ? this.formatDate(selected.startDate) : '',
          [Validators.required],
        ],
        endDate: [
          selected?.endDate ? this.formatDate(selected.endDate) : '',
          [Validators.required],
        ],
      },
      { validators: this.dateRangeValidator },
    );
  }

  private formatDate(date: any): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (start && end && new Date(start) >= new Date(end)) {
      return { invalidRange: true };
    }
    return null;
  }

  protected onClose(): void {
    this.semesterFacade.selectedSemester.set(null);
    this.closed.emit();
  }

  protected onSubmit(): void {
    if (this.semesterForm.invalid) return;

    const formData = this.semesterForm.value;
    const selected = this.semesterFacade.selectedSemester();

    if (this.isEditMode && selected) {
      const updateData: ISemesterResponse = {
        ...selected,
        ...formData,
      };
      this.semesterFacade.updateSemester(updateData).subscribe({
        next: () => this.onClose(),
        error: (err) => console.error('Update failed:', err),
      });
    } else {
      const createData: ISemesterRequest = formData;
      this.semesterFacade.createSemester(createData).subscribe({
        next: () => this.onClose(),
        error: (err) => console.error('Creation failed:', err),
      });
    }
  }
}
