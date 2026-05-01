import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextFormattingService {
  
  applyBold(): void {
    document.execCommand('bold', false);
  }

  applyItalic(): void {
    document.execCommand('italic', false);
  }

  applyUnderline(): void {
    document.execCommand('underline', false);
  }

  // حذف النص المحدد فقط
  deleteSelected(): void {
    document.execCommand('delete', false);
  }

  // مسح كل محتوى المحرر
  clearAll(element: HTMLElement): string {
    element.innerHTML = '';
    return '';
  }
}