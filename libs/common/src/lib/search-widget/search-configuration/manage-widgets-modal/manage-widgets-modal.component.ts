import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
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
import { combineLatest, filter, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { SearchWidgetService } from '../../search-widget.service';
import { NUCLIA_STANDARD_SEARCH_CONFIG, Widget } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { RenameWidgetDialogComponent, DuplicateWidgetDialogComponent } from '../../widgets/dialogs';
import { DEFAULT_WIDGET_CONFIG } from '../../search-widget.models';

interface ConfigurationListItem {
  config: Widget.AnySearchConfiguration;
  widget?: Widget.Widget;
  generativeModel?: string;
  creationDate?: string;
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
    map(([widgets, searchConfigs, defaultModel]) =>
      [{ ...NUCLIA_STANDARD_SEARCH_CONFIG }, ...searchConfigs].map((config) => {
        const widget = widgets.find((candidate) => candidate.searchConfigId === config.id);
        return {
          config,
          widget,
          generativeModel:
            config.type === 'config' ? config.generativeAnswer?.generativeModel || defaultModel : defaultModel,
          creationDate: widget?.creationDate,
          builtIn: config.id.startsWith('nuclia-'),
        };
      }),
    ),
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
        item.widget
          ? this.searchWidgetService.createWidget(name, item.widget.widgetConfig ?? DEFAULT_WIDGET_CONFIG, name)
          : of(undefined),
      ),
    );
  }

  private deleteConfiguration(item: ConfigurationListItem) {
    return this.searchWidgetService
      .deleteSearchConfig(item.config.id)
      .pipe(
        switchMap(() =>
          item.widget ? this.searchWidgetService.deleteWidgetSilently(item.widget.slug) : of(undefined),
        ),
      );
  }
}
