import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaModalModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent } from '@nuclia/sistema';
import { combineLatest, filter, forkJoin, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { SearchWidgetService } from '../../search-widget.service';
import { NUCLIA_STANDARD_SEARCH_CONFIG, Widget } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { RenameWidgetDialogComponent, DuplicateWidgetDialogComponent } from '../../widgets/dialogs';
import { DEFAULT_WIDGET_CONFIG } from '../../search-widget.models';

interface ConfigurationListItem {
  config: Widget.AnySearchConfiguration;
  displayName: string;
  widget?: Widget.Widget;
  widgets: Widget.Widget[];
  generativeModel?: string;
  creationDate?: string;
  searchMode: 'agentic' | 'simple-rag' | 'search';
  widgetMode?: Widget.WidgetConfiguration['widgetMode'];
  builtIn: boolean;
}

/**
 * Compact widget list, reused from `WidgetListComponent`'s table but trimmed into a modal so it can be
 * opened directly from the shared configuration panel — lets the user rename/duplicate/delete any
 * deployed widget, or jump straight to loading one into the panel, without leaving the merged
 * Search + Widgets workspace.
 */
@Component({
  selector: 'stf-manage-widgets-modal',
  imports: [
    CommonModule,
    TranslateModule,
    PaButtonModule,
    PaModalModule,
    InfoCardComponent,
    PaTableModule,
    PaDateTimeModule,
    PaDropdownModule,
    PaPopupModule,
  ],
  templateUrl: './manage-widgets-modal.component.html',
  styleUrl: './manage-widgets-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageWidgetsModalComponent {
  private sdk = inject(SDKService);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);
  private translate = inject(TranslateService);

  modal = inject(ModalRef);

  defaultModel = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getConfiguration()),
    map((config) => config['generative_model'] || ''),
    shareReplay(1),
  );

  configurationList: Observable<ConfigurationListItem[]> = combineLatest([
    this.searchWidgetService.widgetList,
    this.searchWidgetService.searchConfigurations,
    this.defaultModel,
  ]).pipe(
    map(([widgets, searchConfigs, defaultModel]) => {
      const configs = [{ ...NUCLIA_STANDARD_SEARCH_CONFIG }, ...searchConfigs];
      return configs.flatMap((config) => {
        const linkedWidgets = widgets.filter((widget) => widget.searchConfigId === config.id);
        return (linkedWidgets.length > 0 ? linkedWidgets : [undefined]).map((widget) => ({
          config,
          displayName:
            config.id === NUCLIA_STANDARD_SEARCH_CONFIG.id
              ? this.translate.instant('search.configuration.options.nuclia-standard')
              : config.id,
          widget,
          widgets: linkedWidgets,
          generativeModel:
            config.type === 'config' ? config.generativeAnswer?.generativeModel || defaultModel : defaultModel,
          creationDate: widget?.creationDate,
          searchMode:
            config.type === 'config'
              ? config.searchMode || (config.generativeAnswer?.generateAnswer ? 'simple-rag' : 'search')
              : config.value.kind === 'ask'
                ? 'simple-rag'
                : 'search',
          widgetMode: widget ? (widget.widgetConfig ?? DEFAULT_WIDGET_CONFIG).widgetMode : undefined,
          builtIn: config.id.startsWith('nuclia-'),
        }));
      });
    }),
  );

  emptyList: Observable<boolean> = this.configurationList.pipe(map((list) => list.length === 0));

  modelNames = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getLearningSchema()),
    map(
      (schema) =>
        schema['generative_model']?.options?.reduce(
          (acc, model) => {
            acc[model.value] = model.name;
            return acc;
          },
          {} as { [key: string]: string },
        ) || {},
    ),
    shareReplay(1),
  );

  /** Returns both identities so the panel loads this exact embed, not another embed sharing the same config. */
  selectConfiguration(item: ConfigurationListItem) {
    this.modal.close({ configId: item.config.id, widgetSlug: item.widget?.slug });
  }

  rename(item: ConfigurationListItem) {
    this.modalService
      .openModal(
        RenameWidgetDialogComponent,
        new ModalConfig({ data: { name: item.config.id, entity: 'configuration' } }),
      )
      .onClose.pipe(
        filter((name): name is string => !!name && name !== item.config.id),
        switchMap((name) => this.copyConfiguration(item, name)),
        switchMap(() => this.deleteConfiguration(item)),
      )
      .subscribe();
  }

  duplicateAsNew(item: ConfigurationListItem) {
    this.modalService
      .openModal(
        DuplicateWidgetDialogComponent,
        new ModalConfig({ data: { name: item.config.id, entity: 'configuration' } }),
      )
      .onClose.pipe(
        filter((name): name is string => !!name),
        switchMap((name) => this.copyConfiguration(item, name)),
      )
      .subscribe();
  }

  delete(item: ConfigurationListItem) {
    this.searchWidgetService
      .confirmDeleteSearchConfiguration(item.config.id)
      .pipe(
        filter((confirmed) => confirmed),
        switchMap(() => this.deleteConfiguration(item)),
      )
      .subscribe();
  }

  private copyConfiguration(item: ConfigurationListItem, name: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => this.searchWidgetService.saveSearchConfig(kb.id, name, item.config, false)),
      switchMap(() =>
        item.widgets.length > 0
          ? forkJoin(
              item.widgets.map((widget) =>
                this.searchWidgetService.createWidget(name, widget.widgetConfig ?? DEFAULT_WIDGET_CONFIG, name),
              ),
            )
          : of(undefined),
      ),
    );
  }

  private deleteConfiguration(item: ConfigurationListItem) {
    return this.searchWidgetService
      .deleteSearchConfig(item.config.id)
      .pipe(switchMap(() => this.searchWidgetService.deleteWidgetsForSearchConfig(item.config.id)));
  }
}
