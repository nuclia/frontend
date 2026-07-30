import { inject, Injectable } from '@angular/core';
import { getChatOptions, getFindOptions, SearchAndWidgets } from './search-widget.models';
import { SDKService } from '@flaps/core';
import { forkJoin, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { catchError, distinctUntilKeyChanged, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { compareDesc } from 'date-fns';
import { StandaloneService } from '../services';
import { AgenticConfig, SearchConfig, SearchConfigs, Widget } from '@nuclia/core';

const SEARCH_CONFIGS_KEY = 'NUCLIA_SEARCH_CONFIGS';
const SAVED_WIDGETS_KEY = 'NUCLIA_SAVED_WIDGETS';

@Injectable({
  providedIn: 'root',
})
export class SearchWidgetStorageService {
  private sdk = inject(SDKService);
  private storage = inject(LOCAL_STORAGE);
  private standaloneService = inject(StandaloneService);

  private storageUpdated = new Subject<void>();
  private searchAndWidgets = this.sdk.currentKb.pipe(map((kb) => kb.search_configs as SearchAndWidgets | undefined));
  private _searchConfigs = new ReplaySubject<SearchConfigs>(1);
  searchAPIConfigs = this._searchConfigs.asObservable();

  ragLabQuestions: Observable<string[]> = this.searchAndWidgets.pipe(map((data) => data?.ragLabQuestions || []));

  searchConfigurations: Observable<Widget.AnySearchConfiguration[]> = this.storageUpdated.pipe(
    startWith(true),
    switchMap(() => this.sdk.currentKb.pipe(take(1))),
    switchMap((kb) => {
      if (this.standaloneService.standalone) {
        const configMap: { [kbId: string]: Widget.SearchConfiguration[] } = JSON.parse(
          this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}',
        );
        return of(
          (configMap[kb.id] || []).map((config) => ({ ...config, type: 'config' }) as Widget.TypedSearchConfiguration),
        );
      } else {
        return this.searchAPIConfigs.pipe(
          map((searchOptions) => {
            const searchConfigs = ((kb.search_configs as SearchAndWidgets)?.searchConfigurations || []).map(
              (config) =>
                ({
                  ...config,
                  type: 'config',
                }) as Widget.TypedSearchConfiguration,
            );
            const missingConfigs: Widget.SearchAPIConfig[] = Object.entries(searchOptions)
              .filter(([key]) => !searchConfigs.some((config) => config.id === key))
              .map(([id, value]) => ({
                id,
                value,
                type: 'api',
              }));
            return [...searchConfigs, ...missingConfigs];
          }),
        );
      }
    }),
  );

  widgetList: Observable<Widget.Widget[]> = this.storageUpdated.pipe(
    startWith(true),
    switchMap(() => this.sdk.currentKb.pipe(take(1))),
    map((kb) => {
      if (this.standaloneService.standalone) {
        const widgetsMap: { [kbId: string]: Widget.Widget[] } = JSON.parse(
          this.storage.getItem(SAVED_WIDGETS_KEY) || '{}',
        );
        return widgetsMap[kb.id] || [];
      } else {
        return (kb.search_configs as SearchAndWidgets)?.widgets || [];
      }
    }),
    map((widgets) => widgets.sort((a, b) => compareDesc(a.creationDate, b.creationDate))),
  );

  constructor() {
    this.sdk.currentKb
      .pipe(
        distinctUntilKeyChanged('id'),
        tap(() => this._searchConfigs.next({})),
        switchMap(() => this.refreshSearchConfigs()),
      )
      .subscribe(() => {
        this.storageUpdated.next();
      });
  }

  storeRagLabQuestions(updatedQuestions: string[]) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.modify({ search_configs: { ...kb.search_configs, ragLabQuestions: updatedQuestions } })),
      switchMap(() => this.sdk.refreshCurrentKb()),
      tap(() => this.storageUpdated.next()),
    );
  }

  storeSearchConfig(name: string, config: Widget.AnySearchConfiguration): Observable<void> {
    const isAgentic = config.type === 'config' && config.searchMode === 'agentic';
    return this._wasAgenticConfig(name).pipe(
      switchMap((wasAgentic) => {
        const cleanupOrphanedAgenticConfig$ =
          !isAgentic && wasAgentic ? this._deleteAgenticConfig(name) : of(undefined);

        if (config.type === 'api') {
          return forkJoin([
            this._storeSearchOptions(name, config.value),
            this._deleteSearchConfig(name),
            cleanupOrphanedAgenticConfig$,
          ]);
        } else if (isAgentic) {
          const leanConfig: Widget.TypedSearchConfiguration = {
            type: 'config',
            id: config.id,
            searchMode: 'agentic',
            agentic: {
              configId: name,
              transport: config.agentic?.transport,
              searchConfigId: config.agentic?.searchConfigId,
            },
          };
          return this._storeAgenticConfig(name, config.agentic?.config).pipe(
            switchMap(() => forkJoin([this._storeSearchConfig(name, leanConfig), this._deleteSearchOptions(name)])),
          );
        } else {
          // Guaranteed non-agentic here (isAgentic is false in this branch), so searchBox/etc. are populated.
          const standardConfig = config as Widget.StandardSearchConfiguration;
          let searchOptions: SearchConfig;
          if (config.generativeAnswer?.generateAnswer) {
            searchOptions = { kind: 'ask', config: getChatOptions(standardConfig) };
          } else {
            searchOptions = { kind: 'find', config: getFindOptions(standardConfig) };
          }

          return forkJoin([
            this._storeSearchConfig(name, config),
            this._storeSearchOptions(name, searchOptions),
            cleanupOrphanedAgenticConfig$,
          ]);
        }
      }),
      map(() => {
        this.storageUpdated.next();
      }),
    );
  }

  deleteSearchConfig(name: string) {
    return forkJoin([
      this._deleteSearchConfig(name),
      this._deleteSearchOptions(name),
      this._deleteAgenticConfig(name),
    ]).pipe(tap(() => this.storageUpdated.next()));
  }

  private _storeSearchConfig(name: string, config: Widget.SearchConfiguration) {
    return this.sdk.currentKb.pipe(
      take(1),
      map((kb) => (kb.search_configs as SearchAndWidgets)?.searchConfigurations || []),
      switchMap((searchConfigs) => {
        // Override the config if it exists, add it otherwise
        const itemIndex = searchConfigs.findIndex((item) => item.id === name);
        if (itemIndex > -1) {
          searchConfigs[itemIndex] = config;
        } else {
          searchConfigs.push({ ...config, id: name });
        }
        return this._updateSearchConfig(searchConfigs);
      }),
    );
  }

  private _deleteSearchConfig(configId: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      map((kb) => (kb.search_configs as SearchAndWidgets)?.searchConfigurations || []),
      take(1),
      switchMap((searchConfigs) => {
        const itemIndex = searchConfigs.findIndex((item) => item.id === configId);
        if (itemIndex > -1) {
          searchConfigs.splice(itemIndex, 1);
          return this._updateSearchConfig(searchConfigs);
        } else {
          return of(undefined);
        }
      }),
    );
  }

  private _updateSearchConfig(configs: Widget.SearchConfiguration[]) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => {
        if (this.standaloneService.standalone) {
          const configMap: { [kbId: string]: Widget.SearchConfiguration[] } = JSON.parse(
            this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}',
          );
          configMap[kb.id] = configs;
          this.storage.setItem(SEARCH_CONFIGS_KEY, JSON.stringify(configMap));
          return of(undefined);
        } else {
          return this.searchAndWidgets.pipe(
            take(1),
            switchMap((data) => kb.modify({ search_configs: { ...data, searchConfigurations: configs } })),
            switchMap(() => this.sdk.refreshCurrentKb()),
          );
        }
      }),
    );
  }

  private _storeSearchOptions(name: string, config: SearchConfig) {
    if (this.standaloneService.standalone) {
      return of(undefined);
    } else {
      return this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          this.searchAPIConfigs.pipe(
            take(1),
            switchMap((configs) =>
              configs[name] ? kb.updateSearchConfig(name, config) : kb.createSearchConfig(name, config),
            ),
            switchMap(() => this.refreshSearchConfigs()),
          ),
        ),
      );
    }
  }

  private _deleteSearchOptions(name: string) {
    if (this.standaloneService.standalone) {
      return of(undefined);
    } else {
      return this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          this.searchAPIConfigs.pipe(
            take(1),
            switchMap((configs) => (configs[name] ? kb.deleteSearchConfig(name) : of(undefined))),
            switchMap(() => this.refreshSearchConfigs()),
          ),
        ),
      );
    }
  }

  private _storeAgenticConfig(id: string, config: AgenticConfig | undefined) {
    if (!config) {
      return of(undefined);
    }
    const configWithTitle: AgenticConfig = { ...config, title: id };
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        // Try to create first, update if it already exists
        kb.createAgenticConfig(id, configWithTitle).pipe(
          catchError((error) => {
            if (error?.status === 409) {
              return kb.updateAgenticConfig(id, configWithTitle);
            }
            throw error;
          }),
        ),
      ),
    );
  }

  private _deleteAgenticConfig(id: string) {
    // Best-effort cleanup: a 404 (config never existed for this widget config name) is expected and ignored.
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.deleteAgenticConfig(id).pipe(catchError(() => of(undefined)))),
    );
  }

  /** Whether the currently-saved search config entry with this id is an agentic one (used to detect overwrites). */
  private _wasAgenticConfig(name: string): Observable<boolean> {
    return this.sdk.currentKb.pipe(
      take(1),
      map((kb) => (kb.search_configs as SearchAndWidgets)?.searchConfigurations || []),
      map((searchConfigs) => {
        const existing = searchConfigs.find((item) => item.id === name) as Widget.TypedSearchConfiguration | undefined;
        return existing?.type === 'config' && existing.searchMode === 'agentic';
      }),
    );
  }

  private refreshSearchConfigs() {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getSearchConfigs()),
      tap((configs) => this._searchConfigs.next(configs)),
    );
  }

  storeWidgets(updatedWidgets: Widget.Widget[]) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => {
        if (this.standaloneService.standalone) {
          const widgetsMap: { [kbId: string]: Widget.Widget[] } = JSON.parse(
            this.storage.getItem(SAVED_WIDGETS_KEY) || '{}',
          );
          widgetsMap[kb.id] = updatedWidgets;
          this.storage.setItem(SAVED_WIDGETS_KEY, JSON.stringify(widgetsMap));
          return of(undefined);
        } else {
          return this.searchAndWidgets.pipe(
            take(1),
            switchMap((data) => kb.modify({ search_configs: { ...data, widgets: updatedWidgets } })),
            switchMap(() => this.sdk.refreshCurrentKb()),
          );
        }
      }),
      tap(() => this.storageUpdated.next()),
    );
  }
}
