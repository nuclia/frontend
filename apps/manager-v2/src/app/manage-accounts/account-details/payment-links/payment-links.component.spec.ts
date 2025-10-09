import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentLinksComponent } from './payment-links.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { GlobalAccountService } from '../../global-account.service';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';

describe('PaymentLinksComponent', () => {
  let component: PaymentLinksComponent;
  let fixture: ComponentFixture<PaymentLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaButtonModule),
        MockModule(ReactiveFormsModule),
        MockModule(PaTextFieldModule),
        MockModule(PaTogglesModule),
      ],
      declarations: [PaymentLinksComponent],
      providers: [
        MockProvider(GlobalAccountService, {
          getSearchPrice: () => of([]),
          getBillingFormulas: () => of([]),
        }),
        MockProvider(ManagerStore, {
          getAccountId: () => '123abc',
        }),
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
