import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SisToastService } from '@nuclia/sistema';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ExtendedAccount } from '../../global-account.models';
import { ACCOUNT_DETAILS } from '../../test-utils';
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
          getAccount: jest.fn(() => of({} as ExtendedAccount)),
        }),
        MockProvider(AccountService),
        MockProvider(SisToastService),
        MockProvider(ManagerStore, {
          canEdit: of(true),
          accountDetails: of(ACCOUNT_DETAILS),
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

    fixture = TestBed.createComponent(LimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
