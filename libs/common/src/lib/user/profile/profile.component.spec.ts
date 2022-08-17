import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginService, SDKService, TranslatePipeMock, UserService } from '@flaps/core';
import { STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { STFCheckboxModule } from '@flaps/common';
import { MockModule } from 'ng-mocks';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileComponent, TranslatePipeMock],
      imports: [ReactiveFormsModule, STFInputModule, PaButtonModule, MockModule(STFCheckboxModule)],
      providers: [
        {
          provide: TranslateService,
          useValue: {
            get: () => {},
            use: () => {},
          },
        },
        {
          provide: UserService,
          useValue: { userPrefs: of({ email: '', type: 'USER' }) },
        },
        {
          provide: LoginService,
          useValue: { setPreferences: () => of() },
        },
        {
          provide: SDKService,
          useValue: {
            nuclia: {
              auth: {
                setPassword: () => of(),
              },
            },
          },
        },
        { provide: SvgIconRegistryService, useValue: { loadSvg: () => {} } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
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
