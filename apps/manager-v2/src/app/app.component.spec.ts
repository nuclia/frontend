import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService } from '@flaps/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
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
