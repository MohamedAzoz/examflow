import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, interval, map, of, Subscription, switchMap, take } from 'rxjs';
import { System } from '../../data/services/system';

@Injectable({ providedIn: 'root' })
export class Timer {
  private readonly systemService = inject(System);

  private readonly _timeLeftSeconds = signal<number>(0);
  readonly timeLeftSeconds = this._timeLeftSeconds.asReadonly();
 
  private readonly _serverOffsetMs = signal<number>(0);
  private readonly _now = signal<number>(Date.now());
  readonly now = this._now.asReadonly();

  private readonly _isRunning = signal<boolean>(false);
  readonly isRunning = this._isRunning.asReadonly();

  readonly isFinished = computed(() => this._timeLeftSeconds() <= 0);
  readonly countdown = computed(() => this.formatTime(this._timeLeftSeconds()));

  private clockSub: Subscription | null = null;
  private resyncSub: Subscription | null = null;
  private onExpire: (() => void) | null = null;
  private examEndMs = 0;
  private startToken = 0;

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

    this.syncServerTime()
      .pipe(take(1))
      .subscribe(() => {
        if (token !== this.startToken) return;

        this._isRunning.set(true);
        this.tick();

        this.clockSub = interval(1000).subscribe(() => this.tick());
        this.resyncSub = interval(60_000)
          .pipe(
            switchMap(() => this.syncServerTime().pipe(catchError(() => of(void 0)))),
          )
          .subscribe(() => this.tick());
      });
  }

  stopExam(resetCountdown: boolean = true): void {
    this.startToken++;
    this.clockSub?.unsubscribe();
    this.resyncSub?.unsubscribe();
    this.clockSub = null;
    this.resyncSub = null;
    this.onExpire = null;
    this.examEndMs = 0;
    this._isRunning.set(false);

    if (resetCountdown) {
      this._timeLeftSeconds.set(0);
    }
  }

  private syncServerTime() {
    return this.systemService.getServerTime().pipe(
      map((response) => response.serverTime),
      map((serverTime) => this.parseServerTime(serverTime)),
      map((parsedServerMs) => {
        if (parsedServerMs !== null) {
          this._serverOffsetMs.set(parsedServerMs - Date.now());
        }
      }),
      catchError(() => of(void 0)),
      take(1),
    );
  }

  private tick(): void {
    const now = Date.now() + this._serverOffsetMs();
    this._now.set(now);

    if (!this.examEndMs) {
      this._timeLeftSeconds.set(0);
      return;
    }

    const remaining = Math.max(0, Math.floor((this.examEndMs - now) / 1000));
    this._timeLeftSeconds.set(remaining);

    if (remaining === 0 && this._isRunning()) {
      this._isRunning.set(false);
      this.clockSub?.unsubscribe();
      this.resyncSub?.unsubscribe();
      this.clockSub = null;
      this.resyncSub = null;

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

  private formatTime(totalSeconds: number): string {
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
