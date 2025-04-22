import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { SisModalService } from '@nuclia/sistema';
import { BackendConfigurationService, LabelsService, NavigationService, SDKService } from '@flaps/core';
import { Title } from '@angular/platform-browser';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { EventEmitter } from '@angular/core';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        MockProvider(SisModalService),
        MockProvider(BackendConfigurationService),
        MockProvider(SDKService),
        MockProvider(Title),
        MockProvider(NavigationService),
        MockProvider(TranslateService, { onLangChange: new EventEmitter<LangChangeEvent>() }),
        MockProvider(PaTranslateService),
        MockProvider(LabelsService),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
