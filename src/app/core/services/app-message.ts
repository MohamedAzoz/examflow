import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppMessageService {
  private readonly messageService = inject(MessageService);

  addSuccessMessage(message: string): void {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message });
  }

  addInfoMessage(message: string): void {
    this.messageService.add({ severity: 'info', summary: 'Info', detail: message });
  }

  addWarnMessage(message: string): void {
    this.messageService.add({ severity: 'warn', summary: 'Warning', detail: message });
  }

  addErrorMessage(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message });
  }

  buildHttpErrorDetail(error: unknown, productionMessage: string): string {
    const statusCode = this.readStatusCode(error);

    if (environment.production) {
      return statusCode ? `${productionMessage} (Status: ${statusCode})` : productionMessage;
    }

    const backendMessage = this.readBackendMessage(error);
    if (backendMessage && statusCode) {
      return `${backendMessage} (Status: ${statusCode})`;
    }

    if (backendMessage) {
      return backendMessage;
    }

    return statusCode ? `${productionMessage} (Status: ${statusCode})` : productionMessage;
  }

  showHttpError(error: unknown, productionMessage: string): string {
    const detail = this.buildHttpErrorDetail(error, productionMessage);
    this.addErrorMessage(detail);
    return detail;
  }

  private readBackendMessage(error: unknown): string | null {
    const candidate = error as Record<string, unknown> | null;

    const fromNestedError =
      (candidate?.['error'] as Record<string, unknown> | undefined)?.['errorMessage'] ??
      (candidate?.['error'] as Record<string, unknown> | undefined)?.['message'];

    if (typeof fromNestedError === 'string' && fromNestedError.trim().length > 0) {
      return fromNestedError;
    }

    const fromRoot = candidate?.['errorMessage'] ?? candidate?.['message'];
    if (typeof fromRoot === 'string' && fromRoot.trim().length > 0) {
      return fromRoot;
    }

    return null;
  }

  private readStatusCode(error: unknown): number | null {
    const candidate = error as Record<string, unknown> | null;

    const status =
      candidate?.['status'] ??
      candidate?.['statusCode'] ??
      (candidate?.['error'] as Record<string, unknown> | undefined)?.['statusCode'];

    return typeof status === 'number' ? status : null;
  }
}
