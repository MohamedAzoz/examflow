import { Component, OnInit, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseFacade } from '../../../services/course-facade';
import { ICoueseRequest } from '../../../../../data/models/course/icouese-request';
import { ICoueseResponse } from '../../../../../data/models/course/icouese-response';

@Component({
  selector: 'app-course-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './course-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseFacade = inject(CourseFacade);

  readonly closed = output<void>();

  protected courseForm!: FormGroup;
  protected isEditMode = false;

  ngOnInit(): void {
    const selected = this.courseFacade.selectedCourse();
    this.isEditMode = !!selected;

    this.courseForm = this.fb.group({
      name: [selected?.name || '', [Validators.required, Validators.minLength(3)]],
      code: [selected?.code || '', [Validators.required]],
      academicLevel: [
        selected?.academicLevel || 1,
        [Validators.required, Validators.min(1), Validators.max(4)],
      ],
    });
  }

  protected onClose(): void {
    this.courseFacade.selectedCourse.set(null);
    this.closed.emit();
  }

  protected onSubmit(): void {
    if (this.courseForm.invalid) return;

    const formData = this.courseForm.value;
    const selected = this.courseFacade.selectedCourse();

    if (this.isEditMode && selected) {
      const updateData: ICoueseResponse = {
        ...selected,
        ...formData,
      };
      this.courseFacade.updateCourse(updateData).subscribe({
        next: () => this.onClose(),
        error: (err) => console.error('Update failed:', err),
      });
    } else {
      const createData: ICoueseRequest = formData;
      this.courseFacade.createCourse(createData).subscribe({
        next: () => this.onClose(),
        error: (err) => console.error('Creation failed:', err),
      });
    }
  }
}
