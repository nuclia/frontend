import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeaturesService } from '@flaps/core';
import { DEFAULT_RESULT_DISPLAY_CONFIG, GenerativeProviders } from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';
import { MockProvider } from 'ng-mocks';
import { ResultsDisplayFormComponent } from './results-display-form.component';

describe('ResultsDisplayFormComponent', () => {
  let component: ResultsDisplayFormComponent;
  let fixture: ComponentFixture<ResultsDisplayFormComponent>;

  const providers = {
    provider: {
      models: {
        supported: { features: { structured_output: true } },
        unsupported: { features: { structured_output: false } },
      },
    },
  } as GenerativeProviders;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultsDisplayFormComponent],
      providers: [
        MockProvider(FeaturesService, {
          unstable: { knowledgeGraph: false },
        }),
        MockProvider(TranslateService, {
          instant: (key: string) => key,
        }),
      ],
    })
      .overrideComponent(ResultsDisplayFormComponent, {
        set: {
          imports: [],
          template: '',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResultsDisplayFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('generativeProviders', providers);
    fixture.componentRef.setInput('generativeModel', 'supported');
    component.config = {
      ...DEFAULT_RESULT_DISPLAY_CONFIG,
      jsonOutput: true,
    };
    fixture.detectChanges();
  });

  it('does not emit a user edit when model compatibility updates the form programmatically', () => {
    const emitted = jest.fn();
    component.configChanged.subscribe(emitted);

    fixture.componentRef.setInput('generativeModel', 'unsupported');
    fixture.detectChanges();

    expect(component.jsonOutputControl.value).toBe(false);
    expect(component.jsonOutputControl.disabled).toBe(true);
    expect(emitted).not.toHaveBeenCalled();
  });
});
