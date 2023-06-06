import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LimitsComponent } from './limits.component';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { AccountDetailsStore } from '../account-details.store';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';
import { of } from 'rxjs';
import { ExtendedAccount } from '../../account.models';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

describe('LimitsComponent', () => {
  let component: LimitsComponent;
  let fixture: ComponentFixture<LimitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaButtonModule),
        MockModule(ReactiveFormsModule),
        MockModule(PaTextFieldModule),
        MockModule(PaTogglesModule),
      ],
      declarations: [LimitsComponent, MockComponent(FormFooterComponent)],
      providers: [
        MockProvider(AccountDetailsStore, {
          getAccount: jest.fn(() => of({} as ExtendedAccount)),
        }),
        MockProvider(AccountService),
        MockProvider(SisToastService),
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
