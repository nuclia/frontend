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

describe('ConfigurationComponent', () => {
  let component: ConfigurationComponent;
  let fixture: ComponentFixture<ConfigurationComponent>;
  const canEdit = signal(true);

  beforeEach(async () => {
    canEdit.set(true);
    await TestBed.configureTestingModule({
      imports: [ConfigurationComponent, MockComponent(FormFooterComponent), MockComponent(BlockedFeaturesComponent)],
      providers: [
        MockProvider(ManagerStore, {
          canFullyEditAccount: signal(true),
          canEdit,
          accountDetails: signal(ACCOUNT_DETAILS),
        }),
        MockProvider(AccountService, {
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
          getBudget: vi.fn(() => of({ budget_value: null, action_on_budget_exhausted: 'BLOCK_ACCOUNT' as const })),
        }),
        provideNativeDateAdapter(),
        provideBrnCalendarI18n(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enable and disable editable controls when edit permission changes', () => {
    const { type, workflow, trialExpirationDate } = component.configForm.controls;
    expect([type, workflow, trialExpirationDate].every((control) => control.enabled)).toBe(true);

    canEdit.set(false);
    fixture.detectChanges();
    expect([type, workflow, trialExpirationDate].every((control) => control.disabled)).toBe(true);

    canEdit.set(true);
    fixture.detectChanges();
    expect([type, workflow, trialExpirationDate].every((control) => control.enabled)).toBe(true);
  });
});
