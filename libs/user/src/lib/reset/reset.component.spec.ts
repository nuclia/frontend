import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, LoginService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { of } from 'rxjs';

import { ResetComponent } from './reset.component';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { MockModule } from 'ng-mocks';
import { UserContainerModule } from '../user-container';
import { SisPasswordInputModule } from '@nuclia/sistema';

describe('ResetComponent', () => {
  let component: ResetComponent;
  let fixture: ComponentFixture<ResetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ResetComponent],
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
          provide: BackendConfigurationService,
          useValue: { getRecaptchaKey: () => 'key'},
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
