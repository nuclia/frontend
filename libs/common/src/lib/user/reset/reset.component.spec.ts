import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, LoginService, TranslatePipeMock } from '@flaps/core';
import { STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { of } from 'rxjs';

import { ResetComponent } from './reset.component';
import { OldUserContainerComponent } from '../user-container/old-user-container.component';
import { UserContainerLogoComponent } from '../user-container/user-container-logo/user-container-logo.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

describe('ResetComponent', () => {
  let component: ResetComponent;
  let fixture: ComponentFixture<ResetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ResetComponent, TranslatePipeMock, OldUserContainerComponent, UserContainerLogoComponent],
      imports: [ReactiveFormsModule, RouterTestingModule, STFInputModule, PaButtonModule],
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
  }));

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
