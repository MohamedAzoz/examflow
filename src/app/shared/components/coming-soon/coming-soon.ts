import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coming-soon',
  imports: [CommonModule, FormsModule],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.css',
})
export class ComingSoon {
// Signal للتحكم في حالة التحميل أو الرسالة (يمكن توسيعه لاحقاً)
  pageTitle = signal('Page Under Construction');
  message = signal('This page will be available soon in ExamFlow');
  goBack() {
    window.history.back();
  }
}