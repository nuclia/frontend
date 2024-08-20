import { inject, Injectable } from '@angular/core';
import {
  SAVED_WIDGETS_KEY,
  SEARCH_CONFIGS_KEY,
  SearchAndWidgets,
  SearchConfiguration,
  Widget,
} from './search-widget.models';
import { FeaturesService, SDKService, STFUtils } from '@flaps/core';
import { filter, map, Observable, of, Subject, switchMap, take } from 'rxjs';
import { LOCAL_STORAGE } from '@ng-web-apis/common';
import { concatMap, startWith, tap } from 'rxjs/operators';
import { compareDesc } from 'date-fns';
import { StandaloneService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class SearchWidgetStorageService {
  private sdk = inject(SDKService);
  private storage = inject(LOCAL_STORAGE);
  private features = inject(FeaturesService);
  private standaloneService = inject(StandaloneService);

  private storageUpdated = new Subject<void>();
  private searchAndWidgets = this.sdk.currentKb.pipe(map((kb) => kb.search_configs as SearchAndWidgets));

  searchConfigurations: Observable<SearchConfiguration[]> = this.storageUpdated.pipe(
    startWith(true),
    switchMap(() => this.sdk.currentKb.pipe(take(1))),
    map((kb) => {
      if (this.standaloneService.standalone) {
        const configMap: { [kbId: string]: SearchConfiguration[] } = JSON.parse(
          this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}',
        );
        return configMap[kb.id] || [];
      } else {
        return (kb.search_configs as SearchAndWidgets)?.searchConfigurations || [];
      }
    }),
  );

  widgetList: Observable<Widget[]> = this.storageUpdated.pipe(
    startWith(true),
    switchMap(() => this.sdk.currentKb.pipe(take(1))),
    map((kb) => {
      if (this.standaloneService.standalone) {
        const widgetsMap: { [kbId: string]: Widget[] } = JSON.parse(this.storage.getItem(SAVED_WIDGETS_KEY) || '{}');
        return widgetsMap[kb.id] || [];
      } else {
        return (kb.search_configs as SearchAndWidgets)?.widgets || [];
      }
    }),
    map((widgets) => widgets.sort((a, b) => compareDesc(a.creationDate, b.creationDate))),
  );

  storeConfigs(updatedConfigs: SearchConfiguration[]) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => {
        if (this.standaloneService.standalone) {
          const configMap: { [kbId: string]: SearchConfiguration[] } = JSON.parse(
            this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}',
          );
          configMap[kb.id] = updatedConfigs;
          this.storage.setItem(SEARCH_CONFIGS_KEY, JSON.stringify(configMap));
          return of(undefined);
        } else {
          return this.searchAndWidgets.pipe(
            take(1),
            switchMap((data) => kb.modify({ search_configs: { ...data, searchConfigurations: updatedConfigs } })),
            switchMap(() => this.sdk.refreshCurrentKb()),
          );
        }
      }),
      tap(() => this.storageUpdated.next()),
    );
  }

  storeWidgets(updatedWidgets: Widget[]) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => {
        if (this.standaloneService.standalone) {
          const widgetsMap: { [kbId: string]: Widget[] } = JSON.parse(this.storage.getItem(SAVED_WIDGETS_KEY) || '{}');
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

  migrateConfigsAndWidgets() {
    if (this.standaloneService.standalone) {
      return of(undefined);
    }
    return this.features.isKbAdmin.pipe(
      switchMap(() => this.features.isKbAdmin),
      take(1),
      filter((isAdmin) => isAdmin),
      switchMap(() => this.sdk.currentKb),
      take(1),
      concatMap((kb) => this.migrateConfigs(kb.id).pipe(concatMap(() => this.migrateWidgets(kb.id)))),
    );
  }

  private migrateConfigs(kbId: string) {
    const configMap: { [kbId: string]: SearchConfiguration[] } = JSON.parse(
      this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}',
    );
    const oldConfigs = configMap[kbId] || [];
    return this.searchConfigurations.pipe(
      take(1),
      switchMap((storedConfigs) => {
        const toMigrate = oldConfigs.filter((oldConfig) => !storedConfigs.find((config) => config.id === oldConfig.id));
        return toMigrate.length > 0 ? this.storeConfigs(storedConfigs.concat(toMigrate)) : of(undefined);
      }),
      tap(() => {
        const configMap = JSON.parse(this.storage.getItem(SEARCH_CONFIGS_KEY) || '{}');
        delete configMap[kbId];
        this.storage.setItem(SEARCH_CONFIGS_KEY, JSON.stringify(configMap));
      }),
    );
  }

  private migrateWidgets(kbId: string) {
    const widgetsMap: { [kbId: string]: Widget[] } = JSON.parse(this.storage.getItem(SAVED_WIDGETS_KEY) || '{}');
    const oldWidgets = widgetsMap[kbId] || [];
    return this.widgetList.pipe(
      take(1),
      switchMap((storedWidgets) => {
        const toMigrate = oldWidgets.map((oldWidget) => {
          let slug = oldWidget.slug;
          // if slug already exists in this KB, make it unique
          if (storedWidgets.find((widget) => widget.slug === oldWidget.slug)) {
            slug = `${slug}-${STFUtils.generateRandomSlugSuffix()}`;
          }
          return { ...oldWidget, slug };
        });
        return toMigrate.length > 0 ? this.storeWidgets(storedWidgets.concat(toMigrate)) : of(undefined);
      }),
      tap(() => {
        const widgetsMap = JSON.parse(this.storage.getItem(SAVED_WIDGETS_KEY) || '{}');
        delete widgetsMap[kbId];
        this.storage.setItem(SAVED_WIDGETS_KEY, JSON.stringify(widgetsMap));
      }),
    );
  }
}
