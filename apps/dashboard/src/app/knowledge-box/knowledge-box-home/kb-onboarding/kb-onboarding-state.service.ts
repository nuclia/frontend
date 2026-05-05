import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, Subscription } from 'rxjs';
import { FeaturesService, SDKService, GETTING_STARTED_DONE_KEY, UploadEventService } from '@flaps/core';
import { KbOnboardingEntry, KbOnboardingStateMap, OnboardingStep } from './kb-onboarding-state.model';

const KB_ONBOARDING_STATE = 'KB_ONBOARDING_STATE';

const STEP_ORDER: OnboardingStep[] = ['uploading-data', 'processing-data', 'searching-data'];

function stepIndex(step: OnboardingStep): number {
  return STEP_ORDER.indexOf(step);
}

@Injectable({ providedIn: 'root' })
export class KbOnboardingStateService {
  private sdk = inject(SDKService);
  private features = inject(FeaturesService);
  private destroyRef = inject(DestroyRef);
  private uploadEventService = inject(UploadEventService);

  private _state$ = new BehaviorSubject<KbOnboardingEntry | null>(null);

  readonly onboardingState$: Observable<KbOnboardingEntry | null> = this._state$.asObservable();

  readonly isOnboardingDone$: Observable<boolean> = this.onboardingState$.pipe(
    map((state) => state === null),
    distinctUntilChanged(),
  );

  constructor() {
    combineLatest([
      this.sdk.currentKb.pipe(
        map((kb) => kb.id),
        distinctUntilChanged(),
      ),
      this.features.isKbAdmin.pipe(distinctUntilChanged()),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([kbId, isKbAdmin]) => {
        if (localStorage.getItem(GETTING_STARTED_DONE_KEY) === 'true' || !isKbAdmin) {
          this._state$.next(null);
          return;
        }

        const existingEntry = this._getExistingEntry(kbId);
        this._state$.next(existingEntry ?? this._getOrInitEntry(kbId));
      });

    this.isOnboardingDone$
      .pipe(
        map((isDone) => !isDone),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((isActive) => this.uploadEventService.setOnboardingActive(isActive));
  }

  updateState(partial: Partial<KbOnboardingEntry>): void {
    const current = this._state$.getValue();
    if (current === null) {
      return;
    }

    const kbId = this._getCurrentKbId();
    if (!kbId) {
      return;
    }

    const nextStep =
      partial.currentStep !== undefined && stepIndex(partial.currentStep) > stepIndex(current.currentStep)
        ? partial.currentStep
        : current.currentStep;

    const updated: KbOnboardingEntry = {
      ...current,
      ...partial,
      currentStep: nextStep,
    };

    this._persistEntry(kbId, updated);
    this._state$.next(updated);
  }

  skip(): void {
    const current = this._state$.getValue();
    if (current?.currentStep === 'searching-data') {
      this.markDone();
    } else {
      this.updateState({ skipped: true });
    }
  }

  restart(): void {
    const current = this._state$.getValue();
    if (current === null) {
      return;
    }
    this.updateState({ skipped: false });
  }

  markDone(): void {
    const kbId = this._getCurrentKbId();

    localStorage.setItem(GETTING_STARTED_DONE_KEY, 'true');

    if (kbId) {
      const map = this._readStateMap();
      delete map[kbId];
      this._writeStateMap(map);
    }

    this._state$.next(null);
  }

  private _getExistingEntry(kbId: string): KbOnboardingEntry | null {
    const map = this._readStateMap();
    return map[kbId] ?? null;
  }

  private _getOrInitEntry(kbId: string): KbOnboardingEntry {
    const map = this._readStateMap();
    if (map[kbId]) {
      return map[kbId];
    }
    const initial: KbOnboardingEntry = { skipped: false, currentStep: 'uploading-data' };
    map[kbId] = initial;
    this._writeStateMap(map);
    return initial;
  }

  private _persistEntry(kbId: string, entry: KbOnboardingEntry): void {
    const map = this._readStateMap();
    map[kbId] = entry;
    this._writeStateMap(map);
  }

  private _readStateMap(): KbOnboardingStateMap {
    try {
      const raw = localStorage.getItem(KB_ONBOARDING_STATE);
      return raw ? (JSON.parse(raw) as KbOnboardingStateMap) : {};
    } catch {
      return {};
    }
  }

  private _writeStateMap(map: KbOnboardingStateMap): void {
    localStorage.setItem(KB_ONBOARDING_STATE, JSON.stringify(map));
  }

  private _getCurrentKbId(): string | null {
    // currentKb is a ReplaySubject(1) — subscribe synchronously to peek at the latest value.
    let kbId: string | null = null;
    const sub: Subscription = this.sdk.currentKb.subscribe((kb) => {
      kbId = kb.id;
    });
    sub.unsubscribe();
    return kbId;
  }
}
