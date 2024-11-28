import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SelectAccountKbService } from '../select-account-kb.service';

import { SelectAccountComponent } from './select-account.component';
import { TranslatePipeMock } from '@flaps/core';
import { MockModule, MockProvider } from 'ng-mocks';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { of } from 'rxjs';

describe('SelectComponent', () => {
  let component: SelectAccountComponent;
  let fixture: ComponentFixture<SelectAccountComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, RouterTestingModule, MockModule(PaButtonModule)],
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
