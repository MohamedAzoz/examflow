import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

type DisableDevtoolOptions = {
  disableMenu?: boolean;
  clearLog?: boolean;
  interval?: number;
  ondevtoolopen?: () => void;
  ondevtoolclose?: () => void;
  url?: string;
  tkName?: string;
};

type DisableDevtoolFactory = (options: DisableDevtoolOptions) => void;

declare global {
  interface Window {
    DisableDevtool?: DisableDevtoolFactory;
  }
}

const DISABLE_DEVTOOL_SCRIPT_ID = 'ef-disable-devtool-script';
const DISABLE_DEVTOOL_ASSET_PATH = 'assets/vendor/disable-devtool.min.js';

function loadDisableDevtoolFactory(): Promise<DisableDevtoolFactory | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  if (typeof window.DisableDevtool === 'function') {
    return Promise.resolve(window.DisableDevtool);
  }

  const existingScript = document.getElementById(DISABLE_DEVTOOL_SCRIPT_ID);
  if (existingScript) {
    return Promise.resolve(
      typeof window.DisableDevtool === 'function' ? window.DisableDevtool : null,
    );
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = DISABLE_DEVTOOL_SCRIPT_ID;
    script.src = DISABLE_DEVTOOL_ASSET_PATH;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve(typeof window.DisableDevtool === 'function' ? window.DisableDevtool : null);
    };
    script.onerror = () => resolve(null);

    document.head.appendChild(script);
  });
}

async function setupDevtoolProtection(): Promise<void> {
  if (!environment.production) {
    return;
  }

  const disableDevtool = await loadDisableDevtoolFactory();
  if (!disableDevtool) {
    return;
  }

  disableDevtool({
    disableMenu: true,
    clearLog: false,
    interval: 1200,
    ondevtoolopen: () => undefined,
    ondevtoolclose: () => undefined,
    url: 'https://example.com/blocked',
    tkName: '@Ef_Dev-tool2026',
  });
}

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
  void setupDevtoolProtection();
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
