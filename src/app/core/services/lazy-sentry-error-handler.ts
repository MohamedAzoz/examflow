import { ErrorHandler, inject, Injectable } from '@angular/core';
import { MonitoringService } from './monitoring-service';

@Injectable({
  providedIn: 'root',
})
export class LazySentryErrorHandler implements ErrorHandler {
  private monitoringService = inject(MonitoringService);

  handleError(error: any): void {
    // إرسال الخطأ للسيرفس وهي ستتأكد من وجود السنتري قبل الإرسال
    this.monitoringService.captureException(error);
    
    // طباعة الخطأ في الكونسول للمطور
    console.error('Captured Error:', error);
  }
}