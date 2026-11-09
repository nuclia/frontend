import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiToastService } from '@nuclia/ui/toast';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ExtendedAccount } from '../../global-account.models';
import { GlobalAccountService } from '../../global-account.service';
import { ACCOUNT_DETAILS, DEFAULT_LIMITS } from '../../test-utils';
import { AccountDetailsStore } from '../account-details.store';
import { BlockedFeaturesComponent } from '../blocked-features/blocked-features.component';
import { ConfigurationComponent } from './configuration.component';

describe('ConfigurationComponent', () => {
  let component: ConfigurationComponent;
  let fixture: ComponentFixture<ConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationComponent, MockComponent(FormFooterComponent), MockComponent(BlockedFeaturesComponent)],
      providers: [
        MockProvider(AccountDetailsStore, {
          getAccount: vi.fn(() => of({} as ExtendedAccount)),
        }),
        MockProvider(ManagerStore, {
          canFullyEditAccount: of(true),
          canEdit: of(true),
          accountDetails: of(ACCOUNT_DETAILS),
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
});
