import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading';
import { HttpContextToken } from '@angular/common/http';

export const SkipLoading = new HttpContextToken<boolean>(() => false);

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  if (req.context.get(SkipLoading)) {
    return next(req);
  }
  loadingService.show();
  return next(req).pipe(finalize(() => loadingService.hide()));
};
