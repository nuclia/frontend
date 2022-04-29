import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BackendConfigurationService } from '@flaps/auth';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule],
        declarations: [AppComponent],
        providers: [
          {
            provide: TranslateService,
            useValue: { get: () => of(''), setDefaultLang: () => {}, use: () => {}, getBrowserLang: () => 'kr' },
          },
          {
            provide: BackendConfigurationService,
            useValue: { getVersion: () => '1.0', getAPIURL: () => 'key' },
          },
        ],
      }).compileComponents();
    }),
  );

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
