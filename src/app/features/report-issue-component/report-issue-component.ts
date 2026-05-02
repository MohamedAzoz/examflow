import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { AppMessageService } from '../../core/services/app-message';
import { Support } from '../../data/services/support';

@Component({
  selector: 'app-report-issue-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-issue-component.html',
  styleUrl: './report-issue-component.css',
})
export class ReportIssueComponent {
  private supportService = inject(Support);
  private messageService = inject(AppMessageService);
  private location = inject(Location);

  // Signals لإدارة حالة الفورم
  step = signal(1); // 1: إدخال البيانات، 2: التأكيد
  issueText = signal('');
  phoneNumber = signal('');
  isSending = signal(false);
  priority = signal('Normal');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // دالة الانتقال لمرحلة التأكيد
  goToConfirm() {
    if (this.issueText() && this.phoneNumber()) {
      this.step.set(2);
    }
  }

  // إرسال المشكلة للباك إند
  submitIssue() {
    this.isSending.set(true);

    this.supportService
      .reportIssue(
        this.priority(),
        this.issueText(),
        this.phoneNumber(),
        this.selectedFile() || undefined
      )
      .subscribe({
        next: () => {
          this.messageService.addSuccessMessage('Issue reported successfully.');
          this.resetForm();
          setTimeout(() => {
            this.back();
          }, 1000);
        },
        error: (err) => {
          this.messageService.addErrorMessage(err);
          this.isSending.set(false);
        },
      });
  }

  back() {
    this.location.back();
  }

  resetForm() {
    this.step.set(1);
    this.issueText.set('');
    this.phoneNumber.set('');
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.isSending.set(false);
  }
}
