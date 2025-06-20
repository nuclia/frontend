import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SelectAccountKbService } from '../select-account-kb.service';

import { RouterModule } from '@angular/router';
import { BackendConfigurationService, TranslatePipeMock } from '@flaps/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { SelectAccountComponent } from './select-account.component';

describe('SelectComponent', () => {
  let component: SelectAccountComponent;
  let fixture: ComponentFixture<SelectAccountComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RouterModule.forRoot([]), MockModule(PaButtonModule)],
      declarations: [SelectAccountComponent, TranslatePipeMock],
      providers: [
        {
          provide: SelectAccountKbService,
          useValue: {
            getAccounts: () => [],
            getKbs: () => ({}),
            accounts: of([]),
          },
        },
        MockProvider('staticEnvironmentConfiguration', { standalone: false }),
        MockProvider(BackendConfigurationService),
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
