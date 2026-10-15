import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginService, TranslatePipeMock, UserService } from '@flaps/core';
import { of } from 'rxjs';

import { provideRouter } from '@angular/router';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockModule } from 'ng-mocks';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileComponent, TranslatePipeMock],
      imports: [
        ReactiveFormsModule,
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
      ],
      providers: [
        provideRouter([]),
        {
          provide: UserService,
          useValue: { userPrefs: of({ email: '', type: 'USER' }) },
        },
        {
          provide: LoginService,
          useValue: { setPreferences: () => of() },
        },
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
      ],
    }).compileComponents();
  });

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
