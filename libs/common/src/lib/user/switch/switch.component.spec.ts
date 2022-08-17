import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService, BackendConfigurationService, SDKService, StateService, TranslatePipeMock } from '@flaps/core';

import { SwitchComponent } from './switch.component';
import { MockModule } from 'ng-mocks';
import { MatListModule } from '@angular/material/list';
import { STFButtonsModule } from '@flaps/pastanaga';

describe('SwitchComponent', () => {
  let component: SwitchComponent;
  let fixture: ComponentFixture<SwitchComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SwitchComponent, TranslatePipeMock],
      imports: [RouterTestingModule, MockModule(MatListModule), MockModule(STFButtonsModule)],
      providers: [
        { provide: AuthService, useValue: { setNextParams: () => {}, setNextUrl: () => {} } },
        { provide: StateService, useValue: { cleanStash: () => {} } },
        { provide: SDKService, useValue: { nuclia: { db: { getAccounts: () => {} } } } },
        { provide: BackendConfigurationService, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});
