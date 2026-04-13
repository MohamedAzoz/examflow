import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { catchError, finalize, interval, map, of, Subscription, take } from 'rxjs';
import { System } from '../../data/services/system';
import { IdentityService } from './identity-service';

@Injectable({ providedIn: 'root' })
export class Timer {
  private readonly systemService = inject(System);
  private readonly identityService = inject(IdentityService);

  private readonly _timeLeftSeconds = signal<number>(0);
  readonly timeLeftSeconds = this._timeLeftSeconds.asReadonly();

  private readonly _serverOffsetMs = signal<number>(0);
  private readonly _tick = signal<number>(Date.now());
  readonly now = computed(() => this._tick() + this._serverOffsetMs());

  private readonly _isRunning = signal<boolean>(false);
  readonly isRunning = this._isRunning.asReadonly();

  private readonly _syncRequest = signal<{ version: number; force: boolean }>({
    version: 0,
    force: true,
  });

  readonly isFinished = computed(() => this._timeLeftSeconds() <= 0);
  readonly countdown = computed(() => this.formatTime(this._timeLeftSeconds()));

  private clockSub: Subscription | null = null;
  private onExpire: (() => void) | null = null;
  private examEndMs = 0;
  private startToken = 0;
  private lastSyncMs = 0;
  private syncInProgress: any = null;

  constructor() {
    this.initGlobalClock();
    this.initSignalDrivenSync();
    this.bindBrowserSyncEvents();
  }

  private initGlobalClock(): void {
    interval(1000).subscribe(() => this._tick.set(Date.now()));
  }

  private initSignalDrivenSync(): void {
    effect(() => {
      const request = this._syncRequest();

      this.syncServerTime(request.force)
        .pipe(take(1))
        .subscribe(() => {
          if (this._isRunning()) {
            this.tick();
          }
        });
    });
  }

  private bindBrowserSyncEvents(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    window.addEventListener('online', () => {
      if (!this.shouldAllowSync()) {
        return;
      }

      this.requestServerTimeSync(true);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.shouldAllowSync()) {
        this.requestServerTimeSync(false);
      }
    });
  }

  private requestServerTimeSync(force: boolean): void {
    if (!this.shouldAllowSync()) {
      return;
    }

    this._syncRequest.update((current) => ({
      version: current.version + 1,
      force,
    }));
  }

  private shouldAllowSync(): boolean {
    return this.identityService.isAuthenticated() && this._isRunning();
  }

  startExam(startTime: string, durationMinutes: number, onExpire?: () => void): void {
    const parsedStart = Date.parse(startTime);
    if (!Number.isFinite(parsedStart) || durationMinutes <= 0) {
      this.stopExam();
      return;
    }

    this.stopExam(false);
    const token = ++this.startToken;
    this.onExpire = onExpire ?? null;
    this.examEndMs = parsedStart + durationMinutes * 60_000;

    this._isRunning.set(true);
    this.requestServerTimeSync(true);
    this.tick();

    this.clockSub = interval(1000).subscribe(() => this.tick());

    if (token !== this.startToken) {
      this.stopExam(false);
    }
  }

  stopExam(resetCountdown: boolean = true): void {
    this.startToken++;
    this.clockSub?.unsubscribe();
    this.clockSub = null;
    this.onExpire = null;
    this.examEndMs = 0;
    this._isRunning.set(false);

    if (resetCountdown) {
      this._timeLeftSeconds.set(0);
    }
  }

  private syncServerTime(force: boolean = false) {
    if (!this.shouldAllowSync()) {
      return of(void 0);
    }

    // If a sync is already in progress, return the existing observable
    if (this.syncInProgress) {
      return this.syncInProgress;
    }

    // Cooldown: avoid frequent sync unless a forced state change requests it.
    const nowMs = Date.now();
    if (!force && this.lastSyncMs > 0 && nowMs - this.lastSyncMs < 300_000) {
      return of(void 0);
    }

    this.syncInProgress = this.systemService.getServerTime().pipe(
      map((response) => response.serverTime),
      map((serverTime) => this.parseServerTime(serverTime)),
      map((parsedServerMs) => {
        if (parsedServerMs !== null) {
          const now = Date.now();
          this._serverOffsetMs.set(parsedServerMs - now);
          this.lastSyncMs = now;
        }
      }),
      catchError(() => of(void 0)),
      finalize(() => {
        this.syncInProgress = null;
      }),
      take(1),
    );

    return this.syncInProgress;
  }

  private tick(): void {
    const now = this.now();

    if (!this.examEndMs) {
      this._timeLeftSeconds.set(0);
      return;
    }

    const remaining = Math.max(0, Math.floor((this.examEndMs - now) / 1000));
    this._timeLeftSeconds.set(remaining);

    if (remaining === 0 && this._isRunning()) {
      this._isRunning.set(false);
      this.clockSub?.unsubscribe();
      this.clockSub = null;

      const callback = this.onExpire;
      this.onExpire = null;
      if (callback) callback();
    }
  }

  private parseServerTime(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (value instanceof Date) {
      const parsed = value.getTime();
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  formatTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
