import { Routes } from '@angular/router';
import { AUTH_ROUTES } from '../../core/constants/const.route';

export const authRoutes: Routes = [
  {
    path: AUTH_ROUTES.REQUEST_EMAIL.path,
    title: AUTH_ROUTES.REQUEST_EMAIL.title,
    loadComponent: () => import('./request-email/request-email').then((m) => m.RequestEmail),
  },
  {
    path: AUTH_ROUTES.CONFIRM_EMAIL.path,
    title: AUTH_ROUTES.CONFIRM_EMAIL.title,
    loadComponent: () => import('./confirm-email/confirm-email').then((m) => m.ConfirmEmail),
  },
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
