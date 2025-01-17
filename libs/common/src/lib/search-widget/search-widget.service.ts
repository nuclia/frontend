import { inject, Injectable } from '@angular/core';
import {
  DEFAULT_WIDGET_CONFIG,
  getAskToResource,
  getChatPlaceholder,
  getCitationThreshold,
  getCopyDisclaimer,
  getFeatures,
  getFilters,
  getJsonSchema,
  getLang,
  getMaxParagraphs,
  getMaxTokens,
  getNotEnoughDataMessage,
  getPlaceholder,
  getPreselectedFilters,
  getPrompt,
  getQueryPrepend,
  getRagStrategiesProperties,
  getRephrasePrompt,
  getReranker,
  getRrfBoosting,
  getSystemPrompt,
  getWidgetTheme,
  NUCLIA_STANDARD_SEARCH_CONFIG,
  SAVED_CONFIG_KEY,
  SearchConfiguration,
  Widget,
  WidgetConfiguration,
} from './search-widget.models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService, STFUtils } from '@flaps/core';
import { delay, filter, forkJoin, map, Observable, Subject, switchMap, take } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { debounceTime, tap } from 'rxjs/operators';
import { ResourceViewerService } from '../resources';
import { DuplicateWidgetDialogComponent, RenameWidgetDialogComponent } from './widgets/dialogs';
import { SisModalService } from '@nuclia/sistema';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { SearchWidgetStorageService } from './search-widget-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SearchWidgetService {
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);
  private backendConfig = inject(BackendConfigurationService);
  private sanitizer = inject(DomSanitizer);
  private storage = inject(LOCAL_STORAGE);
  private modalService = inject(SisModalService);
  private viewerService = inject(ResourceViewerService);
  private searchWidgetStorage = inject(SearchWidgetStorageService);

  private currentQuery = '';
  private currentFilters: string[] = [];
  private _widgetPreview = new Subject<{ preview: SafeHtml; snippet: string }>();
  private _logs = new Subject<any>();
  widgetPreview = this._widgetPreview.asObservable();
  logs = this._logs.asObservable();
  private _generateWidgetSnippetSubject = new Subject<{
    currentConfig: SearchConfiguration;
    widgetOptions: WidgetConfiguration;
    scrollContainer?: string;
  }>();
  searchConfigurations = this.searchWidgetStorage.searchConfigurations;
  widgetList = this.searchWidgetStorage.widgetList;

  constructor() {
    this._generateWidgetSnippetSubject
      .pipe(
        debounceTime(300),
        switchMap(({ currentConfig, widgetOptions, scrollContainer }) =>
          this._generateWidgetSnippet(currentConfig, widgetOptions, scrollContainer),
        ),
        delay(100), // wait for the widget to render
        tap(() => this.reinitWidgetPreview()),
      )
      .subscribe();
  }

  getSelectedSearchConfig(kbId: string, configs: SearchConfiguration[]): SearchConfiguration {
    const standardConfiguration = { ...NUCLIA_STANDARD_SEARCH_CONFIG };
    const savedConfigMap: { [kbId: string]: string } = JSON.parse(this.storage.getItem(SAVED_CONFIG_KEY) || '{}');
    const savedConfigId = savedConfigMap[kbId];
    if (!savedConfigId) {
      return standardConfiguration;
    }
    const savedConfig = configs.find((config) => config.id === savedConfigId);
    return savedConfig ? savedConfig : standardConfiguration;
  }

  saveSearchConfig(kbId: string, name: string, config: SearchConfiguration) {
    return this.searchConfigurations.pipe(
      take(1),
      switchMap((searchConfigs) => {
        // Override the config if it exists, add it otherwise
        const itemIndex = searchConfigs.findIndex((item) => item.id === name);
        if (itemIndex > -1) {
          searchConfigs[itemIndex] = config;
        } else {
          searchConfigs.push({ ...config, id: name });
        }
        return this.searchWidgetStorage.storeConfigs(searchConfigs);
      }),
      tap(() => {
        this.saveSelectedSearchConfig(kbId, name);
      }),
    );
  }

  saveSelectedSearchConfig(kbId: string, name: string) {
    const selectionMap: { [kbId: string]: string } = JSON.parse(this.storage.getItem(SAVED_CONFIG_KEY) || '{}');
    selectionMap[kbId] = name;
    this.storage.setItem(SAVED_CONFIG_KEY, JSON.stringify(selectionMap));
  }

  deleteSearchConfig(configId: string) {
    return this.searchConfigurations.pipe(
      take(1),
      switchMap((searchConfigs) => {
        const itemIndex = searchConfigs.findIndex((item) => item.id === configId);
        if (itemIndex > -1) {
          searchConfigs.splice(itemIndex, 1);
        }
        return this.searchWidgetStorage.storeConfigs(searchConfigs);
      }),
    );
  }

  generateWidgetSnippet(
    currentConfig: SearchConfiguration,
    widgetOptions: WidgetConfiguration = DEFAULT_WIDGET_CONFIG,
    scrollContainer?: string,
  ) {
    this._generateWidgetSnippetSubject.next({ currentConfig, widgetOptions, scrollContainer });
  }

  private _generateWidgetSnippet(
    currentConfig: SearchConfiguration,
    widgetOptions: WidgetConfiguration,
    scrollContainer?: string,
  ): Observable<{ preview: SafeHtml; snippet: string }> {
    this.deleteWidgetPreview();

    // Search configuration
    const features = getFeatures(currentConfig, widgetOptions);
    const placeholder = getPlaceholder(widgetOptions);
    const chatPlaceholder = getChatPlaceholder(widgetOptions);
    const copyDisclaimer = getCopyDisclaimer(widgetOptions);
    const lang = getLang(widgetOptions);
    const prompt = getPrompt(currentConfig.generativeAnswer);
    const systemPrompt = getSystemPrompt(currentConfig.generativeAnswer);
    const rephrasePrompt = getRephrasePrompt(currentConfig.searchBox);
    const filters = getFilters(currentConfig.searchBox);
    const preselectedFilters = getPreselectedFilters(currentConfig.searchBox);
    const { ragProperties, ragImagesProperties } = getRagStrategiesProperties(
      currentConfig.generativeAnswer.ragStrategies,
    );
    const notEnoughDataMessage = getNotEnoughDataMessage(widgetOptions);
    const askToResource = getAskToResource(currentConfig.generativeAnswer);
    const maxTokens = getMaxTokens(currentConfig.generativeAnswer);
    const maxParagraphs = getMaxParagraphs(currentConfig.generativeAnswer);
    const generativeModel = currentConfig.generativeAnswer.generativeModel
      ? `\n  generativemodel="${currentConfig.generativeAnswer.generativeModel}"`
      : '';
    const vectorset = currentConfig.searchBox.vectorset ? `\n  vectorset="${currentConfig.searchBox.vectorset}"` : '';
    const queryPrepend = getQueryPrepend(currentConfig.searchBox);
    const jsonSchema = getJsonSchema(currentConfig.resultDisplay);
    const reranker = getReranker(currentConfig.searchBox);
    const rrfBoosting = getRrfBoosting(currentConfig.searchBox);
    const citationThreshold = getCitationThreshold(currentConfig.resultDisplay);

    // Widget options
    const theme = getWidgetTheme(widgetOptions);
    const feedback = `\n  feedback="${widgetOptions.feedback}"`;
    let tagName;
    let widgetFileName;
    switch (widgetOptions.widgetMode) {
      case 'popup':
        tagName = 'nuclia-popup';
        widgetFileName = 'nuclia-popup-widget';
        break;
      case 'chat':
        tagName = 'nuclia-chat';
        widgetFileName = 'nuclia-chat-widget';
        break;
      default:
        tagName = 'nuclia-search-bar';
        widgetFileName = 'nuclia-video-widget';
    }
    const isPopupStyle = widgetOptions.widgetMode === 'popup';
    const isSearchMode = !widgetOptions.widgetMode || widgetOptions.widgetMode === 'page';
    const scriptSrc = `https://cdn.nuclia.cloud/${widgetFileName}.umd.js`;

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
        baseSnippet += `\n  ${zone}${features}${prompt}${systemPrompt}${rephrasePrompt}${ragProperties}${ragImagesProperties}${placeholder}${chatPlaceholder}${copyDisclaimer}${lang}${notEnoughDataMessage}${askToResource}${maxTokens}${maxParagraphs}${queryPrepend}${generativeModel}${vectorset}${filters}${preselectedFilters}${privateDetails}${backend}${jsonSchema}${reranker}${rrfBoosting}${citationThreshold}${feedback}`;
        baseSnippet += `></${tagName}>\n`;
        if (isPopupStyle) {
          baseSnippet += `<div data-nuclia="search-widget-button">Click here to open the Nuclia search widget</div>`;
        } else if (isSearchMode) {
          baseSnippet += `<nuclia-search-results ${theme}></nuclia-search-results>`;
        }

        const snippet = `<script src="${scriptSrc}"></script>\n${baseSnippet}`.replace(
          /knowledgebox=/g,
          `audit_metadata='{"config":"${currentConfig.id}"}'\n  knowledgebox=`,
        );
        const cdn = this.backendConfig.getCDN() ? this.backendConfig.getCDN() + '/' : '';
        const preview = this.sanitizer.bypassSecurityTrustHtml(
          baseSnippet
            .replace('zone=', `client="dashboard" backend="${this.backendConfig.getAPIURL()}" cdn="${cdn}" zone=`)
            .replace('features="', `features="debug,`)
            .replace(apiKey, '')
            .replace(
              '<nuclia-search-results',
              `<nuclia-search-results scrollableContainerSelector="${scrollContainer}"`,
            ),
        );

        this._widgetPreview.next({ snippet, preview });
        return { snippet, preview };
      }),
    );
  }

  resetSearchQuery() {
    this.currentQuery = '';
    this.currentFilters = [];
  }

  private reinitWidgetPreview() {
    const searchWidget = document.getElementsByTagName('nuclia-search-bar')[0] as unknown as any;
    if (this.currentQuery) {
      searchWidget?.search(this.currentQuery, this.currentFilters, true);
    }
    searchWidget?.addEventListener('search', (event: { detail: { query: string; filters: string[] } }) => {
      this.currentQuery = event.detail.query;
      this.currentFilters = event.detail.filters;
    });
    searchWidget?.addEventListener('resetQuery', () => {
      this.currentQuery = '';
      this.currentFilters = [];
    });
    searchWidget?.addEventListener('logs', (event: { detail: any }) => {
      this._logs.next(event.detail);
    });
    this.viewerService.init('nuclia-search-results');
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

  /**
   * Create a widget and return its slug.
   *
   * @param name
   * @param widgetConfig
   * @param searchConfigId
   * @param generativeModel Generative model to be used for answering the query
   * @param vectorset Semantic model to be used for answering the query
   */
  createWidget(
    name: string,
    widgetConfig: WidgetConfiguration,
    searchConfigId: string,
    generativeModel: string,
    vectorset: string,
  ): Observable<string> {
    return this.widgetList.pipe(
      take(1),
      switchMap((storedWidgets) => {
        let slug = STFUtils.generateSlug(name);
        // if slug already exists in this KB, make it unique
        if (storedWidgets.find((widget) => widget.slug === slug)) {
          slug = `${slug}-${STFUtils.generateRandomSlugSuffix()}`;
        }
        storedWidgets.push({
          slug,
          name,
          searchConfigId,
          generativeModel,
          widgetConfig,
          vectorset,
          creationDate: new Date().toISOString(),
        });
        return this.searchWidgetStorage.storeWidgets(storedWidgets).pipe(map(() => slug));
      }),
    );
  }

  updateWidget(widgetSlug: string, widgetConfig: WidgetConfiguration, searchConfigId: string) {
    return this.widgetList.pipe(
      take(1),
      switchMap((storedWidgets) => {
        const widget = storedWidgets.find((widget) => widget.slug === widgetSlug);
        if (widget) {
          widget.searchConfigId = searchConfigId;
          widget.widgetConfig = widgetConfig;
        }
        return this.searchWidgetStorage.storeWidgets(storedWidgets);
      }),
    );
  }

  renameWidget(slug: string, name: string): Observable<string> {
    return this.modalService.openModal(RenameWidgetDialogComponent, new ModalConfig({ data: { name } })).onClose.pipe(
      filter((newName) => !!newName),
      map((newName) => newName as string),
      switchMap((newName) => this._renameWidget(slug, newName).pipe(map(() => newName))),
    );
  }

  duplicateWidget(widget: Widget): Observable<string> {
    return this.modalService
      .openModal(DuplicateWidgetDialogComponent, new ModalConfig({ data: { name: widget.name } }))
      .onClose.pipe(
        filter((newName) => !!newName),
        map((newName) => newName as string),
        switchMap((newName) => this._duplicateWidget(widget, newName)),
      );
  }

  deleteWidget(slug: string, name: string) {
    return this.modalService
      .openConfirm({
        title: this.translate.instant('search.widgets.dialog.delete-widget.title', { name }),
        description: 'search.widgets.dialog.delete-widget.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this._deleteWidget(slug)),
      );
  }

  private _deleteWidget(slug: string) {
    return this.widgetList.pipe(
      take(1),
      switchMap((storedWidgets) => {
        const widgetIndex = storedWidgets.findIndex((widget) => widget.slug === slug);
        if (widgetIndex > -1) {
          storedWidgets.splice(widgetIndex, 1);
        }
        return this.searchWidgetStorage.storeWidgets(storedWidgets);
      }),
    );
  }

  private _renameWidget(slug: string, newName: string) {
    return this.widgetList.pipe(
      take(1),
      switchMap((storedWidgets) => {
        const widget = storedWidgets.find((widget) => widget.slug === slug);
        if (widget) {
          widget.name = newName;
        }
        return this.searchWidgetStorage.storeWidgets(storedWidgets);
      }),
    );
  }

  private _duplicateWidget(widget: Widget, newName: string): Observable<string> {
    return this.widgetList.pipe(
      take(1),
      switchMap((storedWidgets) => {
        let slug = STFUtils.generateSlug(newName);
        // if slug already exists in this KB, make it unique
        if (storedWidgets.find((widget) => widget.slug === slug)) {
          slug = `${slug}-${STFUtils.generateRandomSlugSuffix()}`;
        }
        storedWidgets.push({
          ...widget,
          slug,
          name: newName,
          creationDate: new Date().toISOString(),
        });
        return this.searchWidgetStorage.storeWidgets(storedWidgets).pipe(map(() => slug));
      }),
    );
  }
}
