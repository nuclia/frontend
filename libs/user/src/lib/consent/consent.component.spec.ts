import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, BrandService, OAuthService } from '@flaps/core';
import { PaAvatarModule, PaButtonModule, PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { MockModule } from 'ng-mocks';
import { ConsentComponent } from './consent.component';
import { of } from 'rxjs';

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
        {
          provide: OAuthService,
          useValue: {
            getConsentData: () => {
              /* empty */
            },
            consentUrl: () => 'url',
          },
        },
        {
          provide: BackendConfigurationService,
          useValue: {
            getAPIURL: () => 'key',
            getRecaptchaKey: () => 'key',
            getSocialLogin: () => {
              /* empty */
            },
          },
        },
        {
          provide: BrandService,
          useValue: {
            logoPath: of('logo.svg'),
            brandName: of('Agentic RAG'),
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
