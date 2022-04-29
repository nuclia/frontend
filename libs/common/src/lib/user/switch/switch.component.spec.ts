import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService, BackendConfigurationService, SDKService, StateService } from '@flaps/auth';
import { TranslatePipeMock } from '@flaps/core';

import { SwitchComponent } from './switch.component';

describe('SwitchComponent', () => {
  let component: SwitchComponent;
  let fixture: ComponentFixture<SwitchComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SwitchComponent, TranslatePipeMock],
        imports: [RouterTestingModule],
        providers: [
          { provide: AuthService, useValue: { setNextParams: () => {}, setNextUrl: () => {} } },
          { provide: StateService, useValue: { cleanStash: () => {} } },
          { provide: SDKService, useValue: { nuclia: { db: { getAccounts: () => {} } } } },
          { provide: BackendConfigurationService, useValue: {} },
        ],
      }).compileComponents();
    }),
  );

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
