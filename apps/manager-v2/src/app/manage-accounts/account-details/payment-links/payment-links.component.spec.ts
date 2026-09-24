import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { GlobalAccountService } from '../../global-account.service';
import { PaymentLinksComponent } from './payment-links.component';

describe('PaymentLinksComponent', () => {
  let component: PaymentLinksComponent;
  let fixture: ComponentFixture<PaymentLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentLinksComponent],
      providers: [
        MockProvider(GlobalAccountService, {
          getSearchPrice: () => of([]),
          getBillingFormulas: () => of([]),
        }),
        MockProvider(ManagerStore, {
          getAccountId: () => '123abc',
        }),
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
