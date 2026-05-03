import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class MonitoringService {
  // Signal لحفظ مرجع السنتري بعد تحميله
  private sentryInstance = signal<any>(null);

  async init() {
    try {
      const Sentry = await import('@sentry/angular');
      
      Sentry.init({
        dsn: environment.sentryDsn,
        environment: environment.sentryEnv,
        tracesSampleRate: 0.1,
        tracePropagationTargets: ['localhost', /^https:\/\/examflow\.duckdns\.org\/api/],
        replaysSessionSampleRate: 0.0,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            blockAllMedia: true,
            maskAllText: true,
          }),
        ],
        enableLogs: !environment.production,
      });

      // حفظ المرجع وتصديره للـ window إذا أردت استخدامه بالطريقة القديمة
      this.sentryInstance.set(Sentry);
      (window as any).Sentry = Sentry; 
      
    } catch (err) {
      console.error('Failed to load Sentry', err);
    }
  }

  // دالة مساعدة لالتقاط الأخطاء
  captureException(error: any) {
    const sentry = this.sentryInstance();
    if (sentry) {
      sentry.captureException(error);
    }
  }
}