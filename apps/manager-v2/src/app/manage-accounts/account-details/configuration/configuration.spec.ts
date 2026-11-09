import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiToastService } from '@nuclia/ui/toast';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { GlobalAccountService } from '../../global-account.service';
import { ACCOUNT_DETAILS, DEFAULT_LIMITS } from '../../test-utils';
import { BlockedFeaturesComponent } from '../blocked-features/blocked-features.component';
import { ConfigurationComponent } from './configuration.component';
import { ConfigurationService } from './configuration.service';
import { isBudgetChanged, toBudgetPayload, toLimitMode, toMaxValue, UNLIMITED } from './configuration.utils';

describe('Configuration', () => {
  let fixture: ComponentFixture<ConfigurationComponent>;
  let vm: ConfigurationService;
  const canEdit = signal(true);
  const accountDetails = signal(ACCOUNT_DETAILS);

  const getLimitFields = () => Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('app-limit-field'));
  const hasNumberInput = (element: HTMLElement | null) => !!element?.querySelector('input[type="number"]');

  beforeEach(async () => {
    canEdit.set(true);
    accountDetails.set(ACCOUNT_DETAILS);
    await TestBed.configureTestingModule({
      imports: [ConfigurationComponent, MockComponent(FormFooterComponent), MockComponent(BlockedFeaturesComponent)],
      providers: [
        MockProvider(ManagerStore, {
          canFullyEditAccount: signal(true),
          canEdit,
          accountDetails,
        }),
        MockProvider(AccountService, {
          updateAccount: vi.fn(() => of(ACCOUNT_DETAILS)),
          getDefaultLimits: vi.fn(() => of(DEFAULT_LIMITS)),
          getSubscription: vi.fn(() =>
            of({
              provider: 'MANUAL' as const,
              subscription: {
                on_demand_budget: null,
                action_on_budget_exhausted: null,
                free_tokens_per_billing_cycle: 0,
              },
            }),
          ),
        }),
        MockProvider(UiToastService),
        MockProvider(GlobalAccountService, {
          patchBudget: vi.fn(() => of({ budget_value: null, action_on_budget_exhausted: null })),
          getBudget: vi.fn(() => of({ budget_value: null, action_on_budget_exhausted: 'BLOCK_ACCOUNT' as const })),
        }),
        provideNativeDateAdapter(),
        provideBrnCalendarI18n(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigurationComponent);
    vm = fixture.debugElement.injector.get(ConfigurationService);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should enable and disable editable controls when edit permission changes', () => {
    const { type, workflow, trialExpirationDate } = vm.configForm.controls;
    expect([type, workflow, trialExpirationDate].every((control) => control.enabled)).toBe(true);

    canEdit.set(false);
    fixture.detectChanges();
    expect([type, workflow, trialExpirationDate].every((control) => control.disabled)).toBe(true);

    canEdit.set(true);
    fixture.detectChanges();
    expect([type, workflow, trialExpirationDate].every((control) => control.enabled)).toBe(true);
  });

  it('should show the limit input only for limited fields after loading the account', async () => {
    expect(getLimitFields().map(hasNumberInput)).toEqual([true, true, true]);

    accountDetails.set({ ...ACCOUNT_DETAILS, maxKbs: UNLIMITED });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(getLimitFields().map(hasNumberInput)).toEqual([false, true, true]);
  });

  it('should reset a limit to the default of the account type', () => {
    vm.configForm.controls.kbs.controls.maxKbs.setValue(99);

    (getLimitFields()[0].querySelector('button') as HTMLButtonElement).click();

    expect(vm.configForm.controls.kbs.controls.maxKbs.value).toBe(DEFAULT_LIMITS.max_kbs);
    expect(vm.configForm.controls.kbs.dirty).toBe(true);
  });

  it('should save only dirty fields and map unlimited to -1', () => {
    vm.configForm.controls.kbs.controls.kbs_radio.setValue('unlimited');
    vm.configForm.controls.kbs.markAsDirty();

    vm.save();

    expect(TestBed.inject(AccountService).updateAccount).toHaveBeenCalledWith(ACCOUNT_DETAILS.id, { maxKbs: -1 });
  });

  it('should show the budget inputs when limited and save the budget', () => {
    const budgetField = () => fixture.nativeElement.querySelector('app-budget-field') as HTMLElement;
    expect(hasNumberInput(budgetField())).toBe(false);

    vm.budgetForm.patchValue({ custom_budget: 'limit', budget_value: 50 });
    vm.budgetForm.markAsDirty();
    fixture.detectChanges();
    expect(hasNumberInput(budgetField())).toBe(true);

    vm.save();

    expect(TestBed.inject(GlobalAccountService).patchBudget).toHaveBeenCalledWith(ACCOUNT_DETAILS.id, {
      budget_value: 50,
      action_on_budget_exhausted: 'BLOCK_ACCOUNT',
    });
  });

  describe('utils', () => {
    it('should map -1 to unlimited and back', () => {
      expect(toLimitMode(UNLIMITED)).toBe('unlimited');
      expect(toLimitMode(0)).toBe('limit');
      expect(toMaxValue('unlimited', 10)).toBe(UNLIMITED);
      expect(toMaxValue('limit', 10)).toBe(10);
    });

    it('should build a budget payload and detect changes', () => {
      const limited = { budget_value: 5, action_on_budget_exhausted: 'BLOCK_ACCOUNT' as const };
      expect(toBudgetPayload({ custom_budget: 'limit', ...limited })).toEqual(limited);
      expect(toBudgetPayload({ custom_budget: 'unlimited', ...limited })).toEqual({
        budget_value: null,
        action_on_budget_exhausted: null,
      });

      expect(isBudgetChanged(limited, { ...limited })).toBe(false);
      expect(isBudgetChanged(limited, { ...limited, budget_value: 6 })).toBe(true);
      expect(isBudgetChanged(null, limited)).toBe(true);
    });
  });
});
