import { inject, Injectable } from '@angular/core';
import {
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
  NUCLIA_STANDARD_SEARCH_CONFIG,
  SAVED_CONFIG_KEY,
  SAVED_WIDGETS_KEY,
  SEARCH_CONFIGS_KEY,
  SearchConfiguration,
  Widget,
  WidgetConfiguration,
} from './search-widget.models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService, STFUtils } from '@flaps/core';
import { BehaviorSubject, filter, forkJoin, map, Observable, Subject, switchMap, take } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { debounceTime, tap } from 'rxjs/operators';
import { ResourceViewerService } from '../resources';
import { DuplicateWidgetDialogComponent, RenameWidgetDialogComponent } from './widgets/dialogs';
import { SisModalService } from '@nuclia/sistema';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { compareDesc } from 'date-fns';

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

  private currentQuery = '';
  private currentFilters: string[] = [];
  private _widgetPreview = new Subject<{ preview: SafeHtml; snippet: string }>();
  private _widgetList = new BehaviorSubject<Widget[]>([]);
  private _logs = new Subject<any>();
  widgetPreview = this._widgetPreview.asObservable();
  widgetList: Observable<Widget[]> = this._widgetList
    .asObservable()
    .pipe(map((widgets) => widgets.sort((a, b) => compareDesc(a.creationDate, b.creationDate))));
  logs = this._logs.asObservable();
  private _reinitWidgetPreview = new Subject<void>();

  constructor() {
    this._reinitWidgetPreview.pipe(debounceTime(500)).subscribe(() => this.reinitWidgetPreview());
  }

  getSelectedSearchConfig(kbId: string): SearchConfiguration {
    const standardConfiguration = { ...NUCLIA_STANDARD_SEARCH_CONFIG };
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
    const placeholder = getPlaceholder(widgetOptions);
    const prompt = getPrompt(currentConfig.generativeAnswer);
    const filters = getFilters(currentConfig.searchBox);
    const preselectedFilters = getPreselectedFilters(currentConfig.searchBox);
    const { ragProperties, ragImagesProperties } = getRagStrategies(currentConfig.generativeAnswer.ragStrategies);
    const notEnoughDataMessage = getNotEnoughDataMessage(widgetOptions);
    const askToResource = getAskToResource(currentConfig.generativeAnswer);
    const maxTokens = getMaxTokens(currentConfig.generativeAnswer);
    const generativeModel = currentConfig.generativeAnswer.generativeModel
      ? `\n  generativemodel="${currentConfig.generativeAnswer.generativeModel}"`
      : '';
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
      tap(() => this._reinitWidgetPreview.next()),
    );
  }

  private reinitWidgetPreview() {
    const searchWidget = document.getElementsByTagName('nuclia-search-bar')[0] as unknown as any;
    if (this.currentQuery) {
      searchWidget?.search(this.currentQuery, this.currentFilters);
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
   * Create a widget, store it in local storage and return its slug.
   *
   * @param kbId
   * @param name
   * @param widgetConfig
   * @param searchConfigId
   * @param generativeModel
   */
  createWidget(
    kbId: string,
    name: string,
    widgetConfig: WidgetConfiguration,
    searchConfigId: string,
    generativeModel: string,
  ): string {
    const storedWidgets = this.getKBWidgets(kbId);
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
      creationDate: new Date().toISOString(),
    });
    this.storeKBWidgets(kbId, storedWidgets);
    return slug;
  }

  updateWidget(kbId: string, widgetSlug: string, widgetConfig: WidgetConfiguration) {
    const storedWidgets = this.getKBWidgets(kbId);
    const widget = storedWidgets.find((widget) => widget.slug === widgetSlug);
    if (widget) {
      widget.widgetConfig = widgetConfig;
    }
    this.storeKBWidgets(kbId, storedWidgets);
  }

  getSavedWidget(kbId: string, widgetSlug: string): Widget | undefined {
    const storedWidgets = this.getKBWidgets(kbId);
    return storedWidgets.find((widget) => widget.slug === widgetSlug);
  }

  initWidgetList(kbId: string) {
    const widgetsByKbMap: { [kbId: string]: Widget[] } = JSON.parse(this.storage.getItem(SAVED_WIDGETS_KEY) || '{}');
    this._widgetList.next(widgetsByKbMap[kbId] || []);
  }

  renameWidget(slug: string, name: string): Observable<string> {
    return this.modalService.openModal(RenameWidgetDialogComponent, new ModalConfig({ data: { name } })).onClose.pipe(
      filter((newName) => !!newName),
      map((newName) => newName as string),
      switchMap((newName) =>
        this.sdk.currentKb.pipe(
          take(1),
          map((kb) => {
            this._renameWidget(kb.id, slug, newName);
            return newName;
          }),
        ),
      ),
    );
  }

  duplicateWidget(widget: Widget): Observable<string> {
    return this.modalService
      .openModal(DuplicateWidgetDialogComponent, new ModalConfig({ data: { name: widget.name } }))
      .onClose.pipe(
        filter((newName) => !!newName),
        map((newName) => newName as string),
        switchMap((newName) =>
          this.sdk.currentKb.pipe(
            take(1),
            map((kb) => this._duplicateWidget(kb.id, widget, newName)),
          ),
        ),
      );
  }

  deleteWidget(slug: string, name: string): Observable<void> {
    return this.modalService
      .openConfirm({
        title: this.translate.instant('search.widgets.dialog.delete-widget.title', { name }),
        description: 'search.widgets.dialog.delete-widget.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.sdk.currentKb.pipe(take(1))),
        map((kb) => this._deleteWidget(kb.id, slug)),
      );
  }

  private _deleteWidget(kbId: string, slug: string) {
    const storedWidgets = this.getKBWidgets(kbId);
    const widgetIndex = storedWidgets.findIndex((widget) => widget.slug === slug);
    if (widgetIndex > -1) {
      storedWidgets.splice(widgetIndex, 1);
    }
    this.storeKBWidgets(kbId, storedWidgets);
  }

  private _renameWidget(kbId: any, slug: string, newName: string) {
    const storedWidgets = this.getKBWidgets(kbId);
    const widget = storedWidgets.find((widget) => widget.slug === slug);
    if (widget) {
      widget.name = newName;
    }
    this.storeKBWidgets(kbId, storedWidgets);
  }

  private _duplicateWidget(kbId: string, widget: Widget, newName: string): string {
    const storedWidgets = this.getKBWidgets(kbId);
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
    this.storeKBWidgets(kbId, storedWidgets);
    return slug;
  }

  private getKBWidgets(kbId: string): Widget[] {
    const widgetsByKbMap: { [kbId: string]: Widget[] } = JSON.parse(this.storage.getItem(SAVED_WIDGETS_KEY) || '{}');
    return widgetsByKbMap[kbId] || [];
  }

  private storeKBWidgets(kbId: string, updatedWidgets: Widget[]) {
    const widgetsByKbMap: { [kbId: string]: Widget[] } = JSON.parse(this.storage.getItem(SAVED_WIDGETS_KEY) || '{}');
    widgetsByKbMap[kbId] = updatedWidgets;
    this.storage.setItem(SAVED_WIDGETS_KEY, JSON.stringify(widgetsByKbMap));
    this._widgetList.next(updatedWidgets);
  }
}
