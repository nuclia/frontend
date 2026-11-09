import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { BillingFormula } from '../../global-account.models';
import { GlobalAccountService } from '../../global-account.service';
import { SubscriptionsComponent } from './subscriptions.component';

describe('SubscriptionsComponent', () => {
  let fixture: ComponentFixture<SubscriptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionsComponent],
      providers: [
        MockProvider(ManagerStore, { getAccountId: vi.fn(() => 'account-id') }),
        MockProvider(UiToastService),
        MockProvider(GlobalAccountService, {
          getBillingFormulas: vi.fn(() =>
            of([{ id: 'formula-1', title: 'Formula', description: 'Help' } as BillingFormula]),
          ),
          getProductCatalog: vi.fn(() => of({})),
          getAccountSubscription: vi.fn(() => throwError(() => new Error('not found'))),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionsComponent);
    fixture.detectChanges();
  });

  it('should show both creation forms when the account has no subscription', () => {
    const headings = Array.from(fixture.nativeElement.querySelectorAll('h3')).map(
      (h) => (h as HTMLElement).textContent,
    );
    expect(headings).toEqual(['Cloud Zero Subscription', 'Manual Subscription']);
  });
});
