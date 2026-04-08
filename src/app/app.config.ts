import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  ErrorHandler,
  APP_INITIALIZER,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import * as Sentry from '@sentry/angular';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // استمر في استخدامه، فهو رائع للأداء
    provideBrowserGlobalErrorListeners(),

    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },

    provideAppInitializer(() => {
      inject(Sentry.TraceService);
    }),

    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
  ],
};
