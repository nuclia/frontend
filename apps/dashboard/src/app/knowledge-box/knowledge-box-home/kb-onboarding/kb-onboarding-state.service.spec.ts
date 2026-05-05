import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { ReplaySubject } from 'rxjs';
import { FeaturesService, SDKService, GETTING_STARTED_DONE_KEY } from '@flaps/core';
import { WritableKnowledgeBox } from '@nuclia/core';
import { KbOnboardingStateService } from './kb-onboarding-state.service';
import { KbOnboardingEntry } from './kb-onboarding-state.model';

const KB_ONBOARDING_STATE = 'KB_ONBOARDING_STATE';

describe('KbOnboardingStateService', () => {
  let service: KbOnboardingStateService;
  let kbSubject: ReplaySubject<WritableKnowledgeBox>;

  /**
   * Configure TestBed and inject the service.
   * Pass `initialKbId` to pre-seed the ReplaySubject so the constructor
   * subscription fires synchronously before injection.
   */
  function setupService(initialKbId?: string): void {
    kbSubject = new ReplaySubject<WritableKnowledgeBox>(1);
    if (initialKbId) {
      kbSubject.next({ id: initialKbId } as WritableKnowledgeBox);
    }
    TestBed.configureTestingModule({
      providers: [
        KbOnboardingStateService,
        MockProvider(SDKService, { currentKb: kbSubject.asObservable() }),
        MockProvider(FeaturesService, { isKbAdmin: new ReplaySubject<boolean>(1) }),
      ],
    });
    const isKbAdmin = TestBed.inject(FeaturesService).isKbAdmin as ReplaySubject<boolean>;
    isKbAdmin.next(true);
    service = TestBed.inject(KbOnboardingStateService);
  }

  beforeEach(() => localStorage.clear());

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ─── Constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should emit null immediately when GETTING_STARTED_DONE_KEY is "true"', () => {
      localStorage.setItem(GETTING_STARTED_DONE_KEY, 'true');
      setupService('kb-1');

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      expect(state).toBeNull();
    });

    it('should create a default entry when no localStorage state exists for KB', () => {
      setupService('kb-1');

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      expect(state).toEqual({ skipped: false, currentStep: 'uploading-data' });
    });

    it('should ignore stale KB state when GETTING_STARTED_DONE_KEY is "true"', () => {
      localStorage.setItem(GETTING_STARTED_DONE_KEY, 'true');
      localStorage.setItem(
        KB_ONBOARDING_STATE,
        JSON.stringify({ 'kb-1': { skipped: true, currentStep: 'processing-data' } }),
      );
      setupService('kb-1');

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      expect(state).toBeNull();
    });

    it('should persist the new default entry to localStorage', () => {
      setupService('kb-1');

      const raw = localStorage.getItem(KB_ONBOARDING_STATE);
      const map = raw ? JSON.parse(raw) : {};
      expect(map['kb-1']).toEqual({ skipped: false, currentStep: 'uploading-data' });
    });

    it('should load an existing entry from localStorage for the current KB', () => {
      localStorage.setItem(
        KB_ONBOARDING_STATE,
        JSON.stringify({ 'kb-1': { skipped: true, currentStep: 'processing-data' } }),
      );
      setupService('kb-1');

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      expect(state).toEqual({ skipped: true, currentStep: 'processing-data' });
    });

    it('should emit null for non-admin users', () => {
      kbSubject = new ReplaySubject<WritableKnowledgeBox>(1);
      kbSubject.next({ id: 'kb-1' } as WritableKnowledgeBox);
      const isKbAdmin = new ReplaySubject<boolean>(1);
      isKbAdmin.next(false);

      TestBed.configureTestingModule({
        providers: [
          KbOnboardingStateService,
          MockProvider(SDKService, { currentKb: kbSubject.asObservable() }),
          MockProvider(FeaturesService, { isKbAdmin }),
        ],
      });
      service = TestBed.inject(KbOnboardingStateService);

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      expect(state).toBeNull();
    });
  });

  // ─── updateState() ──────────────────────────────────────────────────────────

  describe('updateState()', () => {
    beforeEach(() => setupService('kb-1'));

    it('should advance currentStep forward', () => {
      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.updateState({ currentStep: 'processing-data' });

      expect(state?.currentStep).toBe('processing-data');
    });

    it('should NOT regress currentStep to an earlier step', () => {
      service.updateState({ currentStep: 'processing-data' });

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.updateState({ currentStep: 'uploading-data' }); // attempt regression
      expect(state?.currentStep).toBe('processing-data');
    });

    it('should NOT advance if the new step equals the current step', () => {
      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.updateState({ currentStep: 'uploading-data' });
      expect(state?.currentStep).toBe('uploading-data');
    });

    it('should merge partial fields without touching currentStep', () => {
      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.updateState({ skipped: true });

      expect(state?.skipped).toBe(true);
      expect(state?.currentStep).toBe('uploading-data');
    });

    it('should persist the updated entry to localStorage', () => {
      service.updateState({ currentStep: 'processing-data' });

      const raw = localStorage.getItem(KB_ONBOARDING_STATE);
      const map = raw ? JSON.parse(raw) : {};
      expect(map['kb-1'].currentStep).toBe('processing-data');
    });
  });

  // ─── skip() ─────────────────────────────────────────────────────────────────

  describe('skip()', () => {
    beforeEach(() => setupService('kb-1'));

    it('should set skipped to true when on uploading-data step', () => {
      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.skip();

      expect(state?.skipped).toBe(true);
    });

    it('should set skipped to true when on processing-data step', () => {
      service.updateState({ currentStep: 'processing-data' });

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.skip();

      expect(state?.skipped).toBe(true);
    });

    it('should call markDone instead of skipping when on searching-data step', () => {
      service.updateState({ currentStep: 'searching-data' });

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.skip();

      expect(state).toBeNull();
      expect(localStorage.getItem(GETTING_STARTED_DONE_KEY)).toBe('true');
    });
  });

  // ─── restart() ──────────────────────────────────────────────────────────────

  describe('restart()', () => {
    beforeEach(() => setupService('kb-1'));

    it('should set skipped to false on the current entry', () => {
      service.skip(); // set to true first

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.restart();

      expect(state?.skipped).toBe(false);
    });
  });

  // ─── markDone() ─────────────────────────────────────────────────────────────

  describe('markDone()', () => {
    beforeEach(() => setupService('kb-1'));

    it('should set GETTING_STARTED_DONE_KEY to "true" in localStorage', () => {
      service.markDone();

      expect(localStorage.getItem(GETTING_STARTED_DONE_KEY)).toBe('true');
    });

    it('should emit null after markDone()', () => {
      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      service.markDone();

      expect(state).toBeNull();
    });

    it('should remove the KB entry from the localStorage state map', () => {
      service.markDone();

      const raw = localStorage.getItem(KB_ONBOARDING_STATE);
      const map = raw ? JSON.parse(raw) : {};
      expect(map['kb-1']).toBeUndefined();
    });
  });

  // ─── Per-KB isolation ───────────────────────────────────────────────────────

  describe('per-KB isolation', () => {
    it('should maintain independent entries for different KB IDs', () => {
      setupService('kb-1');

      // Advance kb-1 to processing-data
      service.updateState({ currentStep: 'processing-data' });

      let state: KbOnboardingEntry | null | undefined;
      service.onboardingState$.subscribe((s) => (state = s));

      // Switch to kb-2 → should get a fresh default entry
      kbSubject.next({ id: 'kb-2' } as WritableKnowledgeBox);
      expect(state?.currentStep).toBe('uploading-data');

      // Switch back to kb-1 → should restore the persisted state
      kbSubject.next({ id: 'kb-1' } as WritableKnowledgeBox);
      expect(state?.currentStep).toBe('processing-data');
    });
  });
});
