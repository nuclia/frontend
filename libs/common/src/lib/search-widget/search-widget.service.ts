import { inject, Injectable } from '@angular/core';
import { DEFAULT_WIDGET_CONFIG, SAVED_CONFIG_KEY } from './search-widget.models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService, STFUtils } from '@flaps/core';
import { delay, filter, forkJoin, map, Observable, Subject, switchMap, take } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { catchError, debounceTime, tap } from 'rxjs/operators';
import { ResourceViewerService } from '../resources';
import { DuplicateWidgetDialogComponent, RenameWidgetDialogComponent } from './widgets/dialogs';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { SearchWidgetStorageService } from './search-widget-storage.service';
import { getWidgetParameters, NUCLIA_STANDARD_SEARCH_CONFIG, Widget } from '@nuclia/core';

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
  private toaster = inject(SisToastService);

  private currentQuery = '';
  private currentFilters: string[] = [];
  private _widgetPreview = new Subject<{ preview: SafeHtml; snippet: string; synchSnippet?: string }>();
  private _logs = new Subject<any>();
  widgetPreview = this._widgetPreview.asObservable();
  logs = this._logs.asObservable();
  private _generateWidgetSnippetSubject = new Subject<{
    currentConfig: Widget.AnySearchConfiguration;
    widgetOptions: Widget.WidgetConfiguration;
    widgetId?: string;
    scrollContainer?: string;
  }>();
  searchConfigurations = this.searchWidgetStorage.searchConfigurations;
  supportedSearchConfigurations = this.searchConfigurations.pipe(
    map((configs) => configs.filter((config) => config.type === 'config')),
  );
  widgetList = this.searchWidgetStorage.widgetList;

  constructor() {
    this._generateWidgetSnippetSubject
      .pipe(
        debounceTime(300),
        switchMap(({ currentConfig, widgetOptions, widgetId, scrollContainer }) =>
          this._generateWidgetSnippet(currentConfig, widgetOptions, widgetId, scrollContainer),
        ),
        delay(100), // wait for the widget to render
        tap(() => this.reinitWidgetPreview()),
      )
      .subscribe();
  }

  getSelectedSearchConfig(kbId: string, configs: Widget.AnySearchConfiguration[]): Widget.AnySearchConfiguration {
    const standardConfiguration = { ...NUCLIA_STANDARD_SEARCH_CONFIG };
    const savedConfigMap: { [kbId: string]: string } = JSON.parse(this.storage.getItem(SAVED_CONFIG_KEY) || '{}');
    const savedConfigId = savedConfigMap[kbId];
    if (!savedConfigId) {
      return standardConfiguration;
    }
    const savedConfig = configs.find((config) => config.id === savedConfigId);
    if (savedConfig) {
      return savedConfig;
    } else {
      return standardConfiguration;
    }
  }

  saveSearchConfig(kbId: string, name: string, config: Widget.AnySearchConfiguration) {
    return this.searchWidgetStorage.storeSearchConfig(name, config).pipe(
      catchError((error) => {
        this.toaster.error('search.configuration.save-error');
        throw error;
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
    return this.searchWidgetStorage.deleteSearchConfig(configId);
  }

  generateWidgetSnippet(
    currentConfig: Widget.AnySearchConfiguration,
    widgetOptions: Widget.WidgetConfiguration = DEFAULT_WIDGET_CONFIG,
    widgetId?: string,
    scrollContainer?: string,
  ) {
    this._generateWidgetSnippetSubject.next({ currentConfig, widgetOptions, widgetId, scrollContainer });
  }

  private _generateWidgetSnippet(
    currentConfig: Widget.AnySearchConfiguration,
    widgetOptions: Widget.WidgetConfiguration,
    widgetId?: string,
    scrollContainer?: string,
  ): Observable<{ preview: SafeHtml; snippet: string; synchSnippet?: string }> {
    this.deleteWidgetPreview();

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
    const scriptSrc = `${this.backendConfig.getCDN()}/${widgetFileName}.umd.js`;
    const widgetParameters =
      currentConfig.type === 'config' ? getWidgetParameters(currentConfig, widgetOptions) : undefined;
    const parameters = !!widgetParameters
      ? Object.entries(widgetParameters)
          .filter(([, value]) => !!value)
          .map(([key, value]) => `\n  ${key}="${this.escapeParameter(value || '')}"`)
          .join('')
      : '';

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
        let backend = '';
        if (this.sdk.nuclia.options.standalone || !this.backendConfig.getAPIURL().includes('nuclia.cloud')) {
          backend = `\n  backend="${this.backendConfig.getAPIURL()}"`;
        }
        let cdn = '';
        if (!this.backendConfig.getCDN().includes('nuclia.cloud')) {
          cdn = `\n  cdn="${this.backendConfig.getCDN()}/"`;
        }
        let searchConfigId = '';
        if (currentConfig.type === 'api') {
          searchConfigId = `\n  search_config_id="${currentConfig.id}"`;
        }
        let baseSnippet = `<${tagName}\n  knowledgebox="${kb.id}"`;
        baseSnippet += `\n  ${zone}${privateDetails}${backend}${cdn}${parameters}${searchConfigId}`;
        baseSnippet += `></${tagName}>\n`;
        if (isPopupStyle) {
          baseSnippet += `<div data-nuclia="search-widget-button">Click here to open the Nuclia search widget</div>`;
        } else if (isSearchMode) {
          const theme = widgetParameters?.mode ? `\n mode="${widgetParameters.mode}"` : '';
          baseSnippet += `<nuclia-search-results ${theme}></nuclia-search-results>`;
        }

        let snippet = `<script src="${scriptSrc}"></script>\n${baseSnippet}`.replace(
          /knowledgebox=/g,
          `audit_metadata='{"config":"${currentConfig.id}"}'\n  knowledgebox=`,
        );
        let synchSnippet: string | undefined;
        if (widgetId) {
          const accountParam = privateDetails ? '' : `\n  account="${account.id}"`;
          synchSnippet = snippet
            .replace(parameters, '')
            .replace(`></${tagName}>`, `${accountParam}\n  widget_id="${widgetId}"></${tagName}>`);
        }
        const preview = this.sanitizer.bypassSecurityTrustHtml(
          baseSnippet
            .replace('zone=', `client="dashboard" zone=`)
            .replace('features="', `features="debug,`)
            .replace(apiKey, '')
            .replace(
              '<nuclia-search-results',
              `<nuclia-search-results scrollableContainerSelector="${scrollContainer}"`,
            ),
        );

        this._widgetPreview.next({ snippet, preview, synchSnippet });
        return { snippet, preview, synchSnippet };
      }),
    );
  }

  escapeParameter(prompt: string) {
    return prompt.trim().replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
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
    this.viewerService.handleBackButton(searchWidget);
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
    widgetConfig: Widget.WidgetConfiguration,
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

  updateWidget(widgetSlug: string, widgetConfig: Widget.WidgetConfiguration, searchConfigId: string) {
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

  duplicateWidget(widget: Widget.Widget): Observable<string> {
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

  private _duplicateWidget(widget: Widget.Widget, newName: string): Observable<string> {
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
