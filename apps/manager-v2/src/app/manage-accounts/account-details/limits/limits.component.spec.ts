import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiToastService } from '@nuclia/ui/toast';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ExtendedAccount } from '../../global-account.models';
import { ACCOUNT_DETAILS, DEFAULT_LIMITS } from '../../test-utils';
import { AccountDetailsStore } from '../account-details.store';
import { LimitsComponent } from './limits.component';

describe('LimitsComponent', () => {
  let component: LimitsComponent;
  let fixture: ComponentFixture<LimitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LimitsComponent, MockComponent(FormFooterComponent)],
      providers: [
        MockProvider(AccountDetailsStore, {
          getAccount: vi.fn(() => of({} as ExtendedAccount)),
        }),
        MockProvider(AccountService, {
          getDefaultLimits: vi.fn(() => of(DEFAULT_LIMITS)),
        }),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canEdit: of(true),
          accountDetails: of(ACCOUNT_DETAILS),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
