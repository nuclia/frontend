import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NucliaTokensDetails, NucliaTokensMetric } from '@nuclia/core';
import { UiToastService } from '@nuclia/ui/toast';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { TokenConsumptionComponent } from './token-consumption.component';
import { getTotalTokens, isInvalidHour, toIsoDate } from './token-consumption.utils';

const DETAILS = {
  identifier: { type: 'llm', source: 'predict', version: 'v1', model: 'gpt', service: 'x' },
  raw_usage: { input: 1000, output: 2000, search: null, image: null, storage: null },
  nuclia_tokens: { input: 10, output: 20, search: null, image: null, storage: null, external_requests: null },
} as unknown as NucliaTokensDetails;

describe('TokenConsumption', () => {
  let component: TokenConsumptionComponent;
  let fixture: ComponentFixture<TokenConsumptionComponent>;
  let accountService: AccountService;

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
            of({ name: 'nuclia_tokens', value: 42, details: [DETAILS] } as NucliaTokensMetric),
          ),
        }),
        MockProvider(UiToastService),
        provideNativeDateAdapter(),
        provideBrnCalendarI18n(),
      ],
    }).compileComponents();

    accountService = TestBed.inject(AccountService);
    fixture = TestBed.createComponent(TokenConsumptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load the last 24h of token consumption on init and show the rows', () => {
    expect(component.invalidForm).toBe(false);
    expect(component.tokenConsumption()?.value).toBe(42);

    const cells = fixture.nativeElement.querySelectorAll('tbody tr td') as NodeListOf<HTMLElement>;
    expect(cells[0].textContent).toContain('llm predict gpt');
    expect(cells[cells.length - 1].textContent?.trim()).toBe('30');
  });

  it('should reload for the selected knowledge box tab', () => {
    component.changeTab('kb-1');
    expect(accountService.loadTokenConsumption).toHaveBeenLastCalledWith(
      ACCOUNT_DETAILS.id,
      component.from,
      component.to,
      'kb-1',
    );
  });

  it('should flag an invalid range', () => {
    component.fromDate = new Date(2025, 0, 2);
    component.toDate = new Date(2025, 0, 1);
    expect(component.invalidRange).toBe(true);
    expect(component.invalidForm).toBe(true);
  });

  describe('utils', () => {
    it('should reject hours out of the 0-24 range', () => {
      expect([-1, 0, 24, 25].map(isInvalidHour)).toEqual([true, false, false, true]);
    });

    it('should build an ISO date at the given hour, or nothing when incomplete', () => {
      const date = new Date(2025, 0, 1, 15, 30);
      expect(new Date(toIsoDate(date, 8)).getHours()).toBe(8);
      expect(toIsoDate(undefined, 8)).toBe('');
      expect(toIsoDate(date, 30)).toBe('');
    });

    it('should sum the tokens, or return null when there is no data', () => {
      expect(getTotalTokens(DETAILS.nuclia_tokens)).toBe(30);
      expect(
        getTotalTokens({ input: null, output: null, search: null, image: null, storage: null, external_requests: 5 }),
      ).toBeNull();
    });
  });
});
