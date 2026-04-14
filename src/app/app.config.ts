import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  ErrorHandler,
  provideAppInitializer,
  inject,
  isDevMode,
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations';
import { IdentityService } from './core/services/identity-service';
import { Theme } from './core/services/theme';
import { StorageMigrationService } from './core/AppDbContext/storage-migration.service';
import { provideCloudinaryLoader } from '@angular/common';
import { provideServiceWorker } from '@angular/service-worker';
import { UpdateService } from './core/services/update-service';
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
    provideZonelessChangeDetection(),
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
    MessageService,
    ConfirmationService, // ← الحل هنا: أضف ConfirmationService هنا
    UpdateService,
    provideAnimations(),
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
    // provideCloudinaryLoader('https://cloudinary.com'),
    provideAppInitializer(() => {
      inject(Sentry.TraceService);
      inject(UpdateService);
    }),

    provideAppInitializer(async () => {
      const migration = inject(StorageMigrationService);
      const identity = inject(IdentityService);
      const theme = inject(Theme);

      await migration.migrateLegacyLocalStorageOnce();
      await Promise.all([identity.init(), theme.init()]);
    }),

    provideRouter(routes, withPreloading(NoPreloading)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
