import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, SAMLService, SsoService } from '@flaps/core';
import { of } from 'rxjs';

import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;

  const token = 'saml_token';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CallbackComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: SAMLService, useValue: { getToken: () => of(token) } },
        { provide: SsoService, useValue: { login: () => of() } },
        {
          provide: BackendConfigurationService,
          useValue: { getAllowedHostsRedirect: () => [], getAPIURL: () => '', staticConf: { client: 'dashboard' } },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
