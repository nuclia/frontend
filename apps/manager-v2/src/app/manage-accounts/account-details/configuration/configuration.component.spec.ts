import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigurationComponent } from './configuration.component';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { AccountDetailsStore } from '../account-details.store';
import { AccountService } from '../../account.service';
import { SisToastService } from '@nuclia/sistema';
import { of } from 'rxjs';
import { ExtendedAccount } from '../../global-account.models';
import {
  PaButtonModule,
  PaDatePickerModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ManagerStore } from '../../../manager.store';
import { BlockedFeaturesComponent } from '../blocked-features/blocked-features.component';
import { ACCOUNT_DETAILS } from '../../test-utils';

describe('ConfigurationComponent', () => {
  let component: ConfigurationComponent;
  let fixture: ComponentFixture<ConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaButtonModule),
        MockModule(ReactiveFormsModule),
        MockModule(PaTextFieldModule),
        MockModule(PaTogglesModule),
        MockModule(PaDatePickerModule),
      ],
      declarations: [
        ConfigurationComponent,
        MockComponent(FormFooterComponent),
        MockComponent(BlockedFeaturesComponent),
      ],
      providers: [
        MockProvider(AccountDetailsStore, {
          getAccount: jest.fn(() => of({} as ExtendedAccount)),
        }),
        MockProvider(ManagerStore, {
          canFullyEditAccount: of(true),
          canEdit: of(true),
          accountDetails: of(ACCOUNT_DETAILS),
        }),
        MockProvider(AccountService),
        MockProvider(SisToastService),
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
