import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ExtendedAccount } from '../../global-account.models';
import { GlobalAccountService } from '../../global-account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
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
          getAccount: jest.fn(() => of({} as ExtendedAccount)),
        }),
        MockProvider(ManagerStore, {
          canFullyEditAccount: of(true),
          canEdit: of(true),
          accountDetails: of(ACCOUNT_DETAILS),
        }),
        MockProvider(AccountService),
        MockProvider(SisToastService),
        MockProvider(GlobalAccountService),
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

    fixture = TestBed.createComponent(ConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
