import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, LoginService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { of } from 'rxjs';

import { RecoverComponent } from './recover.component';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { MockModule } from 'ng-mocks';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { UserContainerModule } from '@flaps/common';

describe('RecoverComponent', () => {
  let component: RecoverComponent;
  let fixture: ComponentFixture<RecoverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RecoverComponent],
      imports: [
        MockModule(ReactiveFormsModule),
        MockModule(PaButtonModule),
        MockModule(PaTextFieldModule),
        MockModule(PaTranslateModule),
        MockModule(SisPasswordInputModule),
        MockModule(UserContainerModule),
        RouterTestingModule,
      ],
      providers: [
        {
          provide: LoginService,
          useValue: {
            recover: of({ action: 'check-mail' }),
          },
        },
        { provide: ReCaptchaV3Service, useValue: { execute: () => {} } },
        { provide: BackendConfigurationService, useValue: { getRecaptchaKey: () => 'key' } },
        {
          provide: TranslateService,
          useValue: { get: () => of('') },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecoverComponent);
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
