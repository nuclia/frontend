import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeprecatedSearchComponent } from './deprecated-search.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { BackendConfigurationService, FeaturesService, SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { Account, Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import { PaTogglesModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { ResourceViewerService } from '../../resources/resource-viewer.service';
import { StandaloneService } from '@flaps/common';

describe('SearchComponent', () => {
  let component: DeprecatedSearchComponent;
  let fixture: ComponentFixture<DeprecatedSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeprecatedSearchComponent],
      imports: [MockModule(PaTranslateModule), MockModule(PaTogglesModule)],
      providers: [
        MockProvider(SDKService, {
          currentKb: of({
            id: 'testKb',
            getLabels: jest.fn(() => of({})),
            training: {
              hasModel: jest.fn(() => of(true)),
            },
            getConfiguration: jest.fn(() => of({})),
          } as any as WritableKnowledgeBox),
          currentAccount: of({ id: 'test' } as Account),
          nuclia: {
            options: {
              zone: 'europe',
            },
          } as any as Nuclia,
        }),
        MockProvider(BackendConfigurationService),
        MockProvider(TranslateService),
        MockProvider(ResourceViewerService),
        MockProvider(FeaturesService, { unstable: { knowledgeGraph: of(true) } } as FeaturesService),
        MockProvider(StandaloneService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeprecatedSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should generate and display a search widget', () => {
    expect(component).toBeTruthy();
    const searchPage = fixture.debugElement.nativeElement.querySelector('.search-page');
    expect(searchPage.innerHTML).toContain('nuclia-search-bar');
  });
});