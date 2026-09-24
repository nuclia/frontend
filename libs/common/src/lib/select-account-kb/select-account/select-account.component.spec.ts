import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RouterModule } from '@angular/router';
import { BackendConfigurationService, SDKService, SelectAccountKbService } from '@flaps/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { SelectAccountComponent } from './select-account.component';

describe('SelectComponent', () => {
  let component: SelectAccountComponent;
  let fixture: ComponentFixture<SelectAccountComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        RouterModule.forRoot([]),
        MockModule(PaButtonModule),
        TranslateModule.forRoot(),
        SelectAccountComponent,
      ],
      providers: [
        {
          provide: SelectAccountKbService,
          useValue: {
            getAccounts: () => [],
            getKbs: () => ({}),
            accounts: of([]),
          },
        },
        MockProvider(SDKService, {
          nuclia: {
            auth: {
              logout: () => {
                /* empty */
              },
            },
          },
        } as SDKService),
        MockProvider('staticEnvironmentConfiguration', { standalone: false }),
        MockProvider(BackendConfigurationService),
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
