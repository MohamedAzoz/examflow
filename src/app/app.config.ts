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
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService, MessageService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations';
import { IdentityService } from './core/services/identity-service';
import { Theme } from './core/services/theme';
import { StorageMigrationService } from './core/AppDbContext/storage-migration.service';
import { provideServiceWorker } from '@angular/service-worker';
import { LazySentryErrorHandler } from './core/services/lazy-sentry-error-handler';
import { MonitoringService } from './core/services/monitoring-service';
import { provideCatbeeIndexedDB } from '@ng-catbee/indexed-db';
import { dbConfig } from './core/AppDbContext/dbconfig';

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
            order: 'base, primeng, theme, utilities',
          },
        },
      },
    }),
    provideCatbeeIndexedDB(dbConfig),
    MessageService,
    ConfirmationService,
    provideAnimations(),
    { provide: ErrorHandler, useClass: LazySentryErrorHandler },
    provideAppInitializer(() => inject(MonitoringService).init()),
    provideAppInitializer(() => inject(StorageMigrationService).init()),
    provideAppInitializer(() => inject(IdentityService).init()),
    provideAppInitializer(() => inject(Theme).init()),

    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
