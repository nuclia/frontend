import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaDropdownModule, PaPopupModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { NavigationService, SDKService } from '@flaps/core';
import { AppService } from '@flaps/common';
import { Account, WritableKnowledgeBox } from '@nuclia/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as EN from '../../../../../../../libs/common/src/assets/i18n/en.json';

import { KbHeaderComponent } from './kb-header.component';
import { KbMoreActionsComponent } from '../kb-more-actions/kb-more-actions.component';

function createTranslateLoader() {
  return { getTranslation: () => of(EN) };
}

describe('KbHeaderComponent', () => {
  let component: KbHeaderComponent;
  let fixture: ComponentFixture<KbHeaderComponent>;

  const kb = {
    id: 'kb-id',
    slug: 'kb-slug',
    title: 'Test KB',
    zone: 'test-zone',
    external_index_provider: 'pinecone',
  } as unknown as WritableKnowledgeBox;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KbHeaderComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useFactory: createTranslateLoader },
          useDefaultLang: true,
          defaultLanguage: 'en',
        }),
        MockModule(PaButtonModule),
        MockModule(PaDropdownModule),
        MockModule(PaPopupModule),
        MockModule(PaTooltipModule),
        MockModule(RouterModule),
        MockComponent(KbMoreActionsComponent),
      ],
      providers: [
        MockProvider(SDKService, {
          currentKb: of(kb),
          currentAccount: of({ id: 'account-id', slug: 'account-slug' } as unknown as Account),
          counters: of({ resources: 1, index_size: 1024, paragraphs: 2, fields: 3, sentences: 4 }) as never,
          nuclia: { options: { standalone: false } } as unknown as SDKService['nuclia'],
        }),
        MockProvider(AppService, {
          currentLocale: of('en'),
        }),
        MockProvider(NavigationService, {
          getKbUrl: (accountSlug: string, kbSlug: string) => `/at/${accountSlug}/${kbSlug}`,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KbHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the KB name', () => {
    const h2 = fixture.nativeElement.querySelector('h2');
    expect(h2).toBeTruthy();
    expect(h2.textContent.trim()).toContain('Test KB');
  });

  it('should render the storage summary trigger beside the KB name', () => {
    const trigger = fixture.nativeElement.querySelector('.kb-header-title-block .storage-summary-button');
    expect(trigger).toBeTruthy();
  });

  it('should show the search and upload actions', () => {
    const searchBtn = fixture.nativeElement.querySelector('pa-button[icon="search"]');
    const uploadBtn = fixture.nativeElement.querySelector('pa-button[icon="upload"]');
    expect(searchBtn).toBeTruthy();
    expect(uploadBtn).toBeTruthy();
  });

  it('should derive kbUrl from the current account and KB', () => {
    expect(component.kbUrl()).toBe('/at/account-slug/kb-slug');
  });

  it('should render the shared more actions menu', () => {
    const moreActions = fixture.nativeElement.querySelector('app-kb-more-actions');
    expect(moreActions).toBeTruthy();
  });
});
