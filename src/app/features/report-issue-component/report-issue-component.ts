import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AppMessageService } from '../../core/services/app-message';
import { IdentityService } from '../../core/services/identity-service';

@Component({
  selector: 'app-report-issue-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-issue-component.html',
  styleUrl: './report-issue-component.css',
})
export class ReportIssueComponent {
  private http = inject(HttpClient);
  private messageService = inject(AppMessageService);
  private location = inject(Location);
  private identityService = inject(IdentityService);

  // بيانات البوت (يفضل وضعها في environment.ts)
  private readonly BOT_TOKEN = environment.telegramBotToken;
  private readonly CHAT_ID = environment.telegramChatId;

  // Signals لإدارة حالة الفورم
  step = signal(1); // 1: إدخال البيانات، 2: التأكيد
  issueText = signal('');
  phoneNumber = signal('');
  isSending = signal(false);
  priority = signal('Normal');

  // دالة الانتقال لمرحلة التأكيد
  goToConfirm() {
    if (this.issueText() && this.phoneNumber()) {
      this.step.set(2);
    }
  }

  // إرسال الرسالة إلى تلجرام
  sendToTelegram() {
    this.isSending.set(true);

    const priorityEmoji =
      this.priority() === 'Urgent' ? '🔴' : this.priority() === 'High' ? '🟠' : '🔵';

    const message = `
          ${priorityEmoji} <b>New Technical Issue Reported</b>
          ــــــــــــــــــــــــ
          <b>Name:</b> ${this.identityService.userName()}
          <b>Role:</b> ${this.identityService.userRole()}
          <b>📍 Priority:</b> ${this.priority()}
          <b>📝 Description:</b> ${this.issueText()}
          <b>📱 Phone:</b> ${this.phoneNumber()}
          ــــــــــــــــــــــــ
          <i>Sent via Web Assistant</i>
            `;

    const url = `https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`;

    this.http
      .post(url, {
        chat_id: this.CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      })
      .subscribe({
        next: () => {
          this.messageService.addSuccessMessage('Issue reported successfully.');
          this.resetForm();
          setTimeout(() => {
            this.back();
          }, 1000);
        },
        error: (err) => {
          this.messageService.addErrorMessage('Failed to send the issue, please try again later.');
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
    this.isSending.set(false);
  }
}
