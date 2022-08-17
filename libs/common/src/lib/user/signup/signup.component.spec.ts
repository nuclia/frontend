import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, LoginService, TranslatePipeMock } from '@flaps/core';
import { STFButtonsModule, STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { of } from 'rxjs';
import { SignupComponent } from './signup.component';
import { UserContainerComponent } from '../user-container/user-container.component';
import { UserContainerLogoComponent } from '../user-container/user-container-logo/user-container-logo.component';
import { STFCheckboxModule } from '@flaps/common';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SignupComponent, TranslatePipeMock, UserContainerComponent, UserContainerLogoComponent],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule,
        STFInputModule,
        STFCheckboxModule,
        STFButtonsModule,
      ],
      providers: [
        {
          provide: LoginService,
          useValue: {
            signup: of({ action: 'check-mail' }),
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
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupComponent);
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
