import { CommonModule, NO_ERRORS_SCHEMA } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockModule, MockProvider } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Widget } from '@nuclia/core';

import { SearchWidgetStorageService } from '../../search-widget-storage.service';
import { RoutingFormComponent } from './routing-form.component';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const configWith2Rules: Widget.RoutingConfig = {
  useRouting: true,
  routing: {
    generative_model: 'model-a',
    direct_answer: 'direct-a',
    rules: [
      { search_config: 'sc1', prompt: 'prompt-1' },
      { search_config: 'sc2', prompt: 'prompt-2' },
    ],
  },
};

const configWith3Rules: Widget.RoutingConfig = {
  useRouting: false,
  routing: {
    generative_model: 'model-b',
    direct_answer: 'direct-b',
    rules: [
      { search_config: 'sc3', prompt: 'prompt-3' },
      { search_config: 'sc4', prompt: 'prompt-4' },
      { search_config: 'sc5', prompt: 'prompt-5' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('RoutingFormComponent', () => {
  let component: RoutingFormComponent;
  let fixture: ComponentFixture<RoutingFormComponent>;

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [RoutingFormComponent],
      providers: [
        MockProvider(SearchWidgetStorageService, {
          searchAPIConfigs: of({}),
        }),
      ],
    })
      // Strip out all deeply-coupled standalone imports (ModelSelectorComponent,
      // ExpandableTextareaComponent, PA modules, etc.) so we can test the component
      // logic without any transitive injection dependencies.
      //
      // ReactiveFormsModule is intentionally omitted: its FormControlName directive
      // would try to bind <pa-toggle> / <pa-select> to the form and demand a registered
      // ControlValueAccessor, crashing every test. All assertions are made directly on
      // component.form / component.rulesControls — no DOM form-binding is required.
      // NO_ERRORS_SCHEMA suppresses all remaining template errors.
      .overrideComponent(RoutingFormComponent, {
        set: {
          imports: [CommonModule, MockModule(TranslateModule)],
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RoutingFormComponent);
    component = fixture.componentInstance;

    // Satisfy @Input({ required: true }) before the first CD cycle
    fixture.componentRef.setInput('generativeProviders', {});
    fixture.componentRef.setInput('learningConfigurations', {});

    fixture.detectChanges(); // triggers ngOnInit
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =========================================================================
  // 1 — FormArray does NOT accumulate when switching configs
  // =========================================================================

  describe('FormArray accumulation guard', () => {
    it('1a — single switch A(2 rules) → B(3 rules) leaves exactly 3 rules', () => {
      component.config = configWith2Rules;
      fixture.detectChanges();

      component.config = configWith3Rules;
      fixture.detectChanges();

      expect(component.rulesControls.length).toBe(3);

      // Clean up pending timer
      jest.advanceTimersByTime(500);
    });

    it('1b — double switch A(2) → B(3) → A(2) leaves exactly 2 rules', () => {
      component.config = configWith2Rules;
      fixture.detectChanges();

      component.config = configWith3Rules;
      fixture.detectChanges();

      component.config = configWith2Rules;
      fixture.detectChanges();

      expect(component.rulesControls.length).toBe(2);

      jest.advanceTimersByTime(500);
    });

    it('1c — after jest.advanceTimersByTime(500), form values reflect the CURRENT config only', () => {
      component.config = configWith2Rules;
      fixture.detectChanges();

      component.config = configWith3Rules;
      fixture.detectChanges();

      jest.advanceTimersByTime(500); // trigger the patchValue
      fixture.detectChanges();

      const raw = component.form.getRawValue();
      expect(raw.useRouting).toBe(configWith3Rules.useRouting);
      expect(raw.routing.generative_model).toBe(configWith3Rules.routing!.generative_model);
      expect(raw.routing.rules.length).toBe(3);
      expect(raw.routing.rules[0].search_config).toBe('sc3');
      expect(raw.routing.rules[1].search_config).toBe('sc4');
      expect(raw.routing.rules[2].search_config).toBe('sc5');
      expect(raw.routing.rules[0].prompt).toBe('prompt-3');
    });

    it('1d — setting config to undefined resets the array to 0 rules', () => {
      component.config = configWith2Rules;
      fixture.detectChanges();
      jest.advanceTimersByTime(500);

      component.config = undefined;
      fixture.detectChanges();

      expect(component.rulesControls.length).toBe(0);
    });
  });

  // =========================================================================
  // 2 — Race condition: rapid config switching
  // =========================================================================

  describe('race condition: rapid config switching', () => {
    it('2a — only the last config wins when switching before 500ms', () => {
      // Set A, then immediately set B (no tick between them)
      component.config = configWith2Rules;
      fixture.detectChanges();
      // Do NOT tick — the timer for A is still pending

      component.config = configWith3Rules;
      fixture.detectChanges();

      // Array structure should already reflect B (rules are pushed synchronously)
      expect(component.rulesControls.length).toBe(3);

      // After the timer fires, values must be B's — A's patchValue must be cancelled
      jest.advanceTimersByTime(500);
      fixture.detectChanges();

      const raw = component.form.getRawValue();
      expect(raw.useRouting).toBe(configWith3Rules.useRouting);
      expect(raw.routing.rules.length).toBe(3);
      expect(raw.routing.rules[0].search_config).toBe('sc3');
      expect(raw.routing.rules[2].search_config).toBe('sc5');
    });

    it("2b — A's timer does not fire after B is set; patchValue called exactly once", () => {
      const patchValueSpy = jest.spyOn(component.form, 'patchValue');

      // Set config A — starts a 500 ms timer
      component.config = configWith2Rules;
      fixture.detectChanges();

      // Advance 400 ms — A's timer has NOT fired yet
      jest.advanceTimersByTime(400);

      // Now set config B — should cancel A's timer and start a new one
      component.config = configWith3Rules;
      fixture.detectChanges();

      // Advance past the original A deadline without reaching B's deadline
      jest.advanceTimersByTime(100); // total = 500 ms since A was set; A should NOT fire

      // patchValue must NOT have been called yet (B's timer needs 500 more ms)
      expect(patchValueSpy).not.toHaveBeenCalled();

      // Now let B's timer fire
      jest.advanceTimersByTime(500);
      expect(patchValueSpy).toHaveBeenCalledTimes(1);
      expect(patchValueSpy).toHaveBeenCalledWith(expect.objectContaining({ useRouting: configWith3Rules.useRouting }));
    });
  });

  // =========================================================================
  // 3 — configChanged emission
  // =========================================================================

  describe('configChanged emission', () => {
    it('3a — no emission during FormArray structural setup (emitEvent:false)', () => {
      const emittedValues: Widget.RoutingConfig[] = [];
      component.configChanged.subscribe((v) => emittedValues.push(v));

      // Set a config with 2 rules — array is pushed with emitEvent:false
      component.config = configWith2Rules;
      fixture.detectChanges();

      // Before the 500ms patch-value timer fires, there must be no emissions
      expect(emittedValues.length).toBe(0);

      // After the timer fires, patchValue triggers valueChanges → one emission is expected
      jest.advanceTimersByTime(500);
      expect(emittedValues.length).toBe(1);
    });

    it('3b — addRule() emits configChanged', () => {
      const emittedValues: Widget.RoutingConfig[] = [];
      component.configChanged.subscribe((v) => emittedValues.push(v));

      component.addRule();
      fixture.detectChanges();

      expect(emittedValues.length).toBeGreaterThan(0);
    });

    it('3c — removeRule() emits configChanged', () => {
      // Populate the form first
      component.config = configWith2Rules;
      fixture.detectChanges();
      jest.advanceTimersByTime(500); // let patchValue fire

      const emittedValues: Widget.RoutingConfig[] = [];
      component.configChanged.subscribe((v) => emittedValues.push(v));

      component.removeRule(0);
      fixture.detectChanges();

      expect(emittedValues.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4 — addRule / removeRule
  // =========================================================================

  describe('addRule()', () => {
    it('4a — appends one empty rule', () => {
      expect(component.rulesControls.length).toBe(0);

      component.addRule();
      fixture.detectChanges();

      expect(component.rulesControls.length).toBe(1);
      expect(component.rulesControls[0].getRawValue()).toEqual({
        search_config: '',
        prompt: '',
      });
    });
  });

  describe('removeRule()', () => {
    it('4b — removes the rule at the given index, preserving the rest', () => {
      // Populate with two rules that have distinct values
      component.config = configWith2Rules;
      fixture.detectChanges();
      jest.advanceTimersByTime(500);
      fixture.detectChanges();

      expect(component.rulesControls.length).toBe(2);

      // Remove the first rule — the rule that was at index 1 should remain
      component.removeRule(0);
      fixture.detectChanges();

      expect(component.rulesControls.length).toBe(1);
      expect(component.rulesControls[0].getRawValue().search_config).toBe('sc2');
      expect(component.rulesControls[0].getRawValue().prompt).toBe('prompt-2');
    });
  });

  // =========================================================================
  // 5 — ngOnDestroy cancels the pending timer
  // =========================================================================

  describe('ngOnDestroy()', () => {
    it('5 — cancels the pending patchValue timer when destroyed before 500ms', () => {
      const patchValueSpy = jest.spyOn(component.form, 'patchValue');

      // Set a config — starts the 500ms timer
      component.config = configWith2Rules;
      fixture.detectChanges();

      // Destroy the component before the timer fires
      component.ngOnDestroy();

      // Advance past the 500ms threshold
      jest.advanceTimersByTime(500);

      // patchValue must NOT have been called
      expect(patchValueSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // useRouting getter
  // =========================================================================

  describe('useRouting getter', () => {
    it('reflects the current form control value', () => {
      expect(component.useRouting).toBe(false);

      component.config = configWith2Rules; // useRouting: true
      fixture.detectChanges();
      jest.advanceTimersByTime(500);
      fixture.detectChanges();

      expect(component.useRouting).toBe(true);
    });
  });
});
