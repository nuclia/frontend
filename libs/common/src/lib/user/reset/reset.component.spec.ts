import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, LoginService } from '@flaps/auth';
import { TranslatePipeMock } from '@flaps/core';
import { STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { of } from 'rxjs';

import { ResetComponent } from './reset.component';

describe('ResetComponent', () => {
  let component: ResetComponent;
  let fixture: ComponentFixture<ResetComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ResetComponent, TranslatePipeMock],
        imports: [ReactiveFormsModule, RouterTestingModule, STFInputModule],
        providers: [
          {
            provide: BackendConfigurationService,
            useValue: { getRecaptchaKey: () => 'key', getOAuthLogin: () => false },
          },
          {
            provide: LoginService,
            useValue: {
              reset: of(),
            },
          },
          { provide: ReCaptchaV3Service, useValue: { execute: () => {} } },
          {
            provide: TranslateService,
            useValue: { get: () => of('') },
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetComponent);
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
