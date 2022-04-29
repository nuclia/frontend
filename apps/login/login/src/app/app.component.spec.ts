import { TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService, STFSplashScreenService, STFTrackingService } from '@flaps/auth';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('AppComponent', () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule],
        declarations: [AppComponent],
        providers: [
          {
            provide: STFSplashScreenService,
            useValue: {
              hide: () => {},
              show: () => {},
              shown: true,
            },
          },
          {
            provide: TranslateService,
            useValue: { get: () => of(''), setDefaultLang: () => {}, use: () => {}, getBrowserLang: () => 'kr' },
          },
          {
            provide: BackendConfigurationService,
            useValue: { getVersion: () => '1.0' },
          },
          {
            provide: STFTrackingService,
            useValue: {
              navigation: () => {},
            },
          },
        ],
      }).compileComponents();
    }),
  );

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
