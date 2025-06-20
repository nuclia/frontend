import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BackendConfigurationService, LoginService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { MockModule } from 'ng-mocks';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { UserContainerModule } from '../user-container';
import { RecoverComponent } from './recover.component';

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
        RouterModule.forRoot([]),
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
