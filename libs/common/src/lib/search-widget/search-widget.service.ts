import { inject, Injectable } from '@angular/core';
import {
  DEFAULT_GENERATIVE_ANSWER_CONFIG,
  DEFAULT_RESULT_DISPLAY_CONFIG,
  DEFAULT_SEARCH_BOX_CONFIG,
  DEFAULT_WIDGET_CONFIG,
  getAskToResource,
  getFeatures,
  getFilters,
  getMaxTokens,
  getNotEnoughDataMessage,
  getPlaceholder,
  getPreselectedFilters,
  getPrompt,
  getQueryPrepend,
  getRagStrategies,
  getWidgetTheme,
  SAVED_CONFIG_KEY,
  SEARCH_CONFIGS_KEY,
  SearchConfiguration,
  WidgetConfiguration,
} from './search-widget.models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { forkJoin, map, Observable, Subject, take } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { tap } from 'rxjs/operators';
import { ResourceViewerService } from '../resources';

@Injectable({
  providedIn: 'root',
})
export class SearchWidgetService {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private backendConfig = inject(BackendConfigurationService);
  private sanitizer = inject(DomSanitizer);
  private storage = inject(LOCAL_STORAGE);
  private viewerService = inject(ResourceViewerService);

  private currentQuery = '';
  private _widgetPreview = new Subject<{ preview: SafeHtml; snippet: string }>();
  widgetPreview = this._widgetPreview.asObservable();

  getStandardSearchConfiguration(): SearchConfiguration {
    return {
      id: 'nuclia-standard',
      searchBox: {
        ...DEFAULT_SEARCH_BOX_CONFIG,
        suggestions: true,
        autocompleteFromNERs: true,
      },
      generativeAnswer: {
        ...DEFAULT_GENERATIVE_ANSWER_CONFIG,
        generateAnswer: true,
      },
      resultDisplay: {
        ...DEFAULT_RESULT_DISPLAY_CONFIG,
        displayResults: true,
        relations: true,
      },
    };
  }

  getSelectedSearchConfig(kbId: string): SearchConfiguration {
    const standardConfiguration = this.getStandardSearchConfiguration();
    const savedConfigMap: { [kbId: string]: string } = JSON.parse(this.storage.getItem(SAVED_CONFIG_KEY) || '{}');
    const savedConfigId = savedConfigMap[kbId];
    if (!savedConfigId) {
      return standardConfiguration;
    }
    const configs = this.getSavedSearchConfigs(kbId);
    const savedConfig = configs.find((config) => config.id === savedConfigId);
    return savedConfig ? savedConfig : standardConfiguration;
  }

  getSavedSearchConfigs(kbId: string): SearchConfiguration[] {
    const configMap: { [kbId: string]: SearchConfiguration[] } = JSON.parse(
      this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}',
    );
    return configMap[kbId] || [];
  }

  saveSearchConfig(kbId: string, name: string, config: SearchConfiguration) {
    const configMap: { [kbId: string]: SearchConfiguration[] } = JSON.parse(
      this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}',
    );
    const storedConfigs: SearchConfiguration[] = configMap[kbId] || [];
    // Override the config if it exists, add it otherwise
    const itemIndex = storedConfigs.findIndex((item) => item.id === name);
    if (itemIndex > -1) {
      storedConfigs[itemIndex] = config;
    } else {
      storedConfigs.push({ ...config, id: name });
    }
    configMap[kbId] = storedConfigs;
    this.storage.setItem(SEARCH_CONFIGS_KEY, JSON.stringify(configMap));
    this.saveSelectedSearchConfig(kbId, name);
  }

  saveSelectedSearchConfig(kbId: string, name: string) {
    const selectionMap: { [kbId: string]: string } = JSON.parse(this.storage.getItem(SAVED_CONFIG_KEY) || '{}');
    selectionMap[kbId] = name;
    this.storage.setItem(SAVED_CONFIG_KEY, JSON.stringify(selectionMap));
  }

  deleteSearchConfig(kbId: string, configId: string) {
    const configMap: { [kbId: string]: SearchConfiguration[] } = JSON.parse(
      this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}',
    );
    const storedConfigs: SearchConfiguration[] = configMap[kbId] || [];
    const itemIndex = storedConfigs.findIndex((item) => item.id === configId);
    if (itemIndex > -1) {
      storedConfigs.splice(itemIndex, 1);
      configMap[kbId] = storedConfigs;
      this.storage.setItem(SEARCH_CONFIGS_KEY, JSON.stringify(configMap));
    }
  }

  generateWidgetSnippet(
    currentConfig: SearchConfiguration,
    widgetOptions: WidgetConfiguration = DEFAULT_WIDGET_CONFIG,
  ): Observable<{ preview: SafeHtml; snippet: string }> {
    this.deleteWidgetPreview();

    // Search configuration
    const features = getFeatures(currentConfig, widgetOptions);
    const placeholder = getPlaceholder(currentConfig.searchBox);
    const prompt = getPrompt(currentConfig.generativeAnswer);
    const filters = getFilters(currentConfig.searchBox);
    const preselectedFilters = getPreselectedFilters(currentConfig.searchBox);
    const { ragProperties, ragImagesProperties } = getRagStrategies(currentConfig.generativeAnswer.ragStrategies);
    const notEnoughDataMessage = getNotEnoughDataMessage(currentConfig.generativeAnswer);
    const askToResource = getAskToResource(currentConfig.generativeAnswer);
    const maxTokens = getMaxTokens(currentConfig.generativeAnswer);
    const generativeModel = `\n  generativemodel="${currentConfig.generativeAnswer.generativeModel}"`;
    const queryPrepend = getQueryPrepend(currentConfig.searchBox);

    // Widget options
    const theme = getWidgetTheme(widgetOptions);
    const isPopupStyle = widgetOptions.popupStyle === 'popup';
    const tagName = isPopupStyle ? 'nuclia-popup' : 'nuclia-search-bar';
    const scriptSrc = `https://cdn.nuclia.cloud/nuclia-${isPopupStyle ? 'popup' : 'video'}-widget.umd.js`;

    return forkJoin([this.sdk.currentKb.pipe(take(1)), this.sdk.currentAccount.pipe(take(1))]).pipe(
      map(([kb, account]) => {
        const zone = this.sdk.nuclia.options.standalone
          ? `standalone="true"`
          : `zone="${this.sdk.nuclia.options.zone}"`;
        const apiKey = `apikey="YOUR_API_TOKEN"`;
        const privateDetails =
          kb.state === 'PRIVATE'
            ? `\n  state="${kb.state}"\n  account="${account.id}"\n  kbslug="${kb.slug}"\n  ${apiKey}`
            : '';
        const backend = this.sdk.nuclia.options.standalone ? `\n  backend="${this.backendConfig.getAPIURL()}"` : '';

        let baseSnippet = `<${tagName}${theme}\n  knowledgebox="${kb.id}"`;
        baseSnippet += `\n  ${zone}${features}${prompt}${ragProperties}${ragImagesProperties}${placeholder}${notEnoughDataMessage}${askToResource}${maxTokens}${queryPrepend}${generativeModel}${filters}${preselectedFilters}${privateDetails}${backend}`;
        baseSnippet += `></${tagName}>\n`;
        if (isPopupStyle) {
          baseSnippet += `<div data-nuclia="search-widget-button">Click here to open the Nuclia search widget</div>`;
        } else {
          baseSnippet += `<nuclia-search-results ${theme}></nuclia-search-results>`;
        }

        const snippet = `<script src="${scriptSrc}"></script>\n${baseSnippet}`;
        const preview = this.sanitizer.bypassSecurityTrustHtml(
          baseSnippet
            .replace(
              'zone=',
              `client="dashboard" backend="${this.backendConfig.getAPIURL()}" lang="${
                this.translate.currentLang
              }" zone=`,
            )
            .replace('features="', `features="dumpLog,`)
            .replace(apiKey, '')
            .replace('<nuclia-search-results', '<nuclia-search-results scrollableContainerSelector=".preview-content"'),
        );

        this._widgetPreview.next({ snippet, preview });
        return { snippet, preview };
      }),
      tap(() => {
        // Run the search with the current query if any
        setTimeout(() => {
          const searchWidget = document.getElementsByTagName('nuclia-search-bar')[0] as unknown as any;
          if (this.currentQuery) {
            searchWidget?.search(this.currentQuery);
          }
          searchWidget?.addEventListener('search', (event: { detail: string }) => {
            this.currentQuery = event.detail;
          });
          searchWidget?.addEventListener('resetQuery', () => {
            this.currentQuery = '';
          });
          this.viewerService.init('nuclia-search-results');
        }, 500);
      }),
    );
  }

  private deleteWidgetPreview() {
    const searchWidgetElement = document.querySelector('nuclia-search') as any;
    const searchBarElement = document.querySelector('nuclia-search-bar') as any;
    const searchResultsElement = document.querySelector('nuclia-search-results') as any;
    if (typeof searchWidgetElement?.$$c?.$destroy === 'function') {
      searchWidgetElement.$$c?.$destroy();
    }
    if (typeof searchBarElement?.$$c?.$destroy === 'function') {
      searchBarElement.$$c?.$destroy();
    }
    if (typeof searchResultsElement?.$$c?.$destroy === 'function') {
      searchResultsElement.$$c?.$destroy();
    }
    searchWidgetElement?.remove();
    searchBarElement?.remove();
    searchResultsElement?.remove();
  }
}
