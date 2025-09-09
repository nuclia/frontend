import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, OAuthService } from '@flaps/core';
import { PaAvatarModule, PaButtonModule, PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { MockModule } from 'ng-mocks';
import { ConsentComponent } from './consent.component';

describe('ConsentComponent', () => {
  let component: ConsentComponent;
  let fixture: ComponentFixture<ConsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConsentComponent],
      imports: [
        RouterModule.forRoot([]),
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
            getLogoPath: () => 'logo.svg',
            getBrandName: () => 'Agentic RAG',
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
