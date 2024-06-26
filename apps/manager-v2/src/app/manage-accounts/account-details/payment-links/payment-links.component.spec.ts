import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentLinksComponent } from './payment-links.component';
import { MockProvider } from 'ng-mocks';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { GlobalAccountService } from '../../global-account.service';

describe('PaymentLinksComponent', () => {
  let component: PaymentLinksComponent;
  let fixture: ComponentFixture<PaymentLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaButtonModule, ReactiveFormsModule, PaTextFieldModule, PaTogglesModule],
      declarations: [PaymentLinksComponent],
      providers: [MockProvider(GlobalAccountService)],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
