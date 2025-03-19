import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, OAuthService } from '@flaps/core';
import { ConsentComponent } from './consent.component';
import { MockModule } from 'ng-mocks';
import { PaAvatarModule, PaButtonModule, PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';

describe('ConsentComponent', () => {
  let component: ConsentComponent;
  let fixture: ComponentFixture<ConsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsentComponent],
      imports: [
        RouterTestingModule,
        MockModule(PaAvatarModule),
        MockModule(PaIconModule),
        MockModule(PaButtonModule),
        MockModule(PaTranslateModule),
      ],
      providers: [
        { provide: OAuthService, useValue: { getConsentData: () => {}, consentUrl: () => 'url' } },
        {
          provide: BackendConfigurationService,
          useValue: {
            getAPIURL: () => 'key',
            getRecaptchaKey: () => 'key',
            getSocialLogin: () => {},
            getAssetsPath: () => 'assets',
            getBrandName: () => 'Nuclia',
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsentComponent);
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
