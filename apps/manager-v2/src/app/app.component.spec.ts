import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockProvider } from 'ng-mocks';
import { BackendConfigurationService } from '@flaps/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { EventEmitter } from '@angular/core';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        MockProvider(BackendConfigurationService),
        MockProvider(TranslateService, { onLangChange: new EventEmitter<LangChangeEvent>() }),
        MockProvider(PaTranslateService),
      ],
    }).compileComponents();
  });

  it('should render version', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.version')?.textContent).toContain('Version:');
  });
});
