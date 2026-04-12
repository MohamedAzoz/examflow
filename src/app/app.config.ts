import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  ErrorHandler,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import { NoPreloading, provideRouter, Router, withPreloading } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
// const MyCustomPreset = definePreset(Aura, {
//   semantic: {
//     primary: {
//       50: '#',
//       100: '#CCD5FF',
//       200: '#99AAFF',
//       300: '#6680FF',
//       400: '#3355FF',
//       500: '#357b85',
//     },
//   },
// });
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // استمر في استخدامه، فهو رائع للأداء
    provideBrowserGlobalErrorListeners(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng, utilities',
          },
        },
      },
    }),
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

    provideRouter(routes, withPreloading(NoPreloading)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
  ],
};
