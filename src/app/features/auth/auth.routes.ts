import { Routes } from '@angular/router';
import { AUTH_ROUTES, ROUTES } from '../../core/constants/const.route';

export const authRoutes: Routes = [
  {
    path: AUTH_ROUTES.FORGET_PASSWORD.path,
    title: AUTH_ROUTES.FORGET_PASSWORD.title,
    loadComponent: () => import('./forget-password/forget-password').then((m) => m.ForgetPassword),
  },
  {
    path: AUTH_ROUTES.VERIFY_OTP.path,
    title: AUTH_ROUTES.VERIFY_OTP.title,
    loadComponent: () => import('./verify-otp/verify-otp').then((m) => m.VerifyOtp),
  },
  {
    path: AUTH_ROUTES.RESET_PASSWORD.path,
    title: AUTH_ROUTES.RESET_PASSWORD.title,
    loadComponent: () => import('./reset-password/reset-password').then((m) => m.ResetPassword),
  },
];
