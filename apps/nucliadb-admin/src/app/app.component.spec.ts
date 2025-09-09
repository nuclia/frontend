import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, LabelsService, NavigationService, SDKService } from '@flaps/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { SisModalService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
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
