import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
import DisableDevtool from 'disable-devtool';

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

if (environment.production) {
  DisableDevtool({
    disableMenu: true,
    clearLog: true,
    interval: 200,
    ondevtoolopen: (type: any, next: () => void) => {
      console.log('DevTools detected! Type:', type);
      // next();
    },
    ondevtoolclose: () => {
      console.log('DevTools closed');
    },
    url: 'https://example.com/blocked',
    tkName: 'ddtk',
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
