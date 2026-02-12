import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginService, TranslatePipeMock, UserService } from '@flaps/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockModule } from 'ng-mocks';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileComponent, TranslatePipeMock],
      imports: [
        ReactiveFormsModule,
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(PaTogglesModule),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [
        TranslateService,
        {
          provide: UserService,
          useValue: { userPrefs: of({ email: '', type: 'USER' }) },
        },
        {
          provide: LoginService,
          useValue: { setPreferences: () => of() },
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
