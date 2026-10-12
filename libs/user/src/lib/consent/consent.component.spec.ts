import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, BrandService, OAuthService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ConsentComponent } from './consent.component';

describe('ConsentComponent', () => {
  let component: ConsentComponent;
  let fixture: ComponentFixture<ConsentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsentComponent, RouterModule.forRoot([]), TranslateModule.forRoot()],
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
