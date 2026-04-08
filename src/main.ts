import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

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

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
