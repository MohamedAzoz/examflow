import { ErrorHandler, inject, Injectable } from '@angular/core';
import { MonitoringService } from './monitoring-service';
import { AppMessageService } from './app-message';

@Injectable({
  providedIn: 'root',
})
export class LazySentryErrorHandler implements ErrorHandler {
  private monitoringService = inject(MonitoringService);
  private readonly messageService = inject(AppMessageService);

  handleError(error: any): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;
    const moduleFailedMessage = /Failed to fetch dynamically imported module/;

    if (chunkFailedMessage.test(error.message) || moduleFailedMessage.test(error.message)) {
      const lastReload = sessionStorage.getItem('last-chunk-reload');
      const now = Date.now();

      if (lastReload && now - parseInt(lastReload) < 10000) {
        this.messageService.addErrorMessage(
          'Multiple loading failures. Please check your internet connection.',
        );
        return;
      }

      this.monitoringService.captureException(new Error(`Auto-Reload due to: ${error.message}`));

      sessionStorage.setItem('last-chunk-reload', now.toString());

      this.messageService.addWarnMessage(
        'New version available or files missing. Refreshing in 2 seconds...',
      );

      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return;
    }

    this.monitoringService.captureException(error);
    console.error('Captured Error:', error);
  }
}
