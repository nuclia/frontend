import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { TranslateService } from '@ngx-translate/core';
import { Widget, NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { ResourceViewerService } from '../resources';
import { SearchWidgetStorageService } from './search-widget-storage.service';
import { SearchWidgetService } from './search-widget.service';

describe('SearchWidgetService', () => {
  let service: SearchWidgetService;
  let widgetList: BehaviorSubject<Widget.Widget[]>;
  let storeWidgets: jest.Mock;

  beforeEach(() => {
    widgetList = new BehaviorSubject<Widget.Widget[]>([]);
    storeWidgets = jest.fn(() => of(undefined));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SDKService,
          useValue: {
            currentKb: of({ id: 'kb-id', state: 'PUBLIC', slug: 'kb-slug' }),
            currentAccount: of({ id: 'account-id' }),
            nuclia: { options: { standalone: false, zone: 'europe-1' } },
          },
        },
        {
          provide: BackendConfigurationService,
          useValue: {
            getAPIURL: () => 'https://rag.progress.cloud',
            getCDN: () => 'https://cdn.rag.progress.cloud',
          },
        },
        { provide: DomSanitizer, useValue: { bypassSecurityTrustHtml: (html: string) => html } },
        { provide: TranslateService, useValue: {} },
        { provide: LOCAL_STORAGE, useValue: { getItem: () => null, setItem: jest.fn() } },
        { provide: SisModalService, useValue: {} },
        { provide: SisToastService, useValue: {} },
        { provide: ResourceViewerService, useValue: {} },
        {
          provide: SearchWidgetStorageService,
          useValue: {
            searchConfigurations: of([]),
            widgetList,
            storeWidgets,
          },
        },
      ],
    });

    service = TestBed.inject(SearchWidgetService);
  });

  it('generates configuration-specific embed code', async () => {
    const standardConfig = { ...NUCLIA_STANDARD_SEARCH_CONFIG };
    const customConfig: Widget.TypedSearchConfiguration = {
      ...NUCLIA_STANDARD_SEARCH_CONFIG,
      id: 'custom-configuration',
      searchBox: {
        ...NUCLIA_STANDARD_SEARCH_CONFIG.searchBox,
        highlight: !NUCLIA_STANDARD_SEARCH_CONFIG.searchBox.highlight,
      },
    };

    const standardSnippet = await firstValueFrom(
      service.generateWidgetSnippetForEmbed(standardConfig, {}, 'standard-embed'),
    );
    const customSnippet = await firstValueFrom(service.generateWidgetSnippetForEmbed(customConfig, {}, 'custom-embed'));

    expect(standardSnippet.snippet).toContain('"config":"nuclia-standard","widget":"standard-embed"');
    expect(customSnippet.snippet).toContain('"config":"custom-configuration","widget":"custom-embed"');
    expect(customSnippet.snippet).not.toBe(standardSnippet.snippet);
  });

  it('removes every embed linked to a deleted configuration', async () => {
    const retainedWidget = { slug: 'retained', searchConfigId: 'retained-configuration' } as Widget.Widget;
    const deletedWidgets = [
      { slug: 'deleted-page', searchConfigId: 'deleted-configuration' },
      { slug: 'deleted-chat', searchConfigId: 'deleted-configuration' },
    ] as Widget.Widget[];
    widgetList.next([retainedWidget, ...deletedWidgets]);

    await firstValueFrom(service.deleteWidgetsForSearchConfig('deleted-configuration'));

    expect(storeWidgets).toHaveBeenCalledWith([retainedWidget]);
  });
});
