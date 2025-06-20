import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { MockModule } from 'ng-mocks';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { UserContainerModule } from '../user-container';
import { ResetComponent } from './reset.component';

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
        RouterModule.forRoot([]),
      ],
      providers: [
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
