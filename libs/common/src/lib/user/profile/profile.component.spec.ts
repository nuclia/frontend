import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService, SDKService, LoginService } from '@flaps/core';
import { TranslatePipeMock } from '@flaps/core';
import { STFInputModule } from '@flaps/pastanaga';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileComponent, TranslatePipeMock],
      imports: [ReactiveFormsModule, STFInputModule],
      providers: [
        {
          provide: TranslateService,
          useValue: { use: () => {} },
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
