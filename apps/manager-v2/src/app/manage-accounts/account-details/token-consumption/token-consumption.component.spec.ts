import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NucliaTokensMetric } from '@nuclia/core';
import { UiToastService } from '@nuclia/ui/toast';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { TokenConsumptionComponent } from './token-consumption.component';

describe('TokenConsumptionComponent', () => {
  let component: TokenConsumptionComponent;
  let fixture: ComponentFixture<TokenConsumptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TokenConsumptionComponent],
      providers: [
        MockProvider(ManagerStore, {
          accountDetails: signal(ACCOUNT_DETAILS),
          kbList: signal([]),
        }),
        MockProvider(AccountService, {
          loadTokenConsumption: vi.fn(() =>
            of({ name: 'nuclia_tokens', value: 42, details: [] } as NucliaTokensMetric),
          ),
        }),
        MockProvider(UiToastService),
        provideNativeDateAdapter(),
        provideBrnCalendarI18n(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TokenConsumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the last 24h of token consumption on init', () => {
    expect(component.invalidForm).toBe(false);
    expect(component.tokenConsumption()?.value).toBe(42);
  });
});
