import { EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
      declarations: [MainComponent],
      providers: [
        MockProvider(BackendConfigurationService),
        MockProvider(TranslateService, { onLangChange: new EventEmitter<LangChangeEvent>() }),
        MockProvider(PaTranslateService),
        MockProvider(SDKService),
      ],
    }).compileComponents();
  });

  it('should render version', () => {
    const fixture = TestBed.createComponent(MainComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.version')?.textContent).toContain('Version:');
  });
});
