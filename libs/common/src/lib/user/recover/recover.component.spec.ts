import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, LoginService, TranslatePipeMock } from '@flaps/core';
import { STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { of } from 'rxjs';

import { RecoverComponent } from './recover.component';
import { OldUserContainerComponent } from '../user-container/old-user-container.component';
import { UserContainerLogoComponent } from '../user-container/user-container-logo/user-container-logo.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

describe('RecoverComponent', () => {
  let component: RecoverComponent;
  let fixture: ComponentFixture<RecoverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RecoverComponent, TranslatePipeMock, OldUserContainerComponent, UserContainerLogoComponent],
      imports: [ReactiveFormsModule, RouterTestingModule, MatDialogModule, STFInputModule, PaButtonModule],
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
