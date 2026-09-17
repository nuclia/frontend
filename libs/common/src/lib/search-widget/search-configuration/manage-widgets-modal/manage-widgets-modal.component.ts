import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  ModalRef,
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaModalModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent } from '@nuclia/sistema';
import { combineLatest, map, Observable, shareReplay, switchMap } from 'rxjs';
import { SDKService } from '@flaps/core';
import { SearchWidgetService } from '../../search-widget.service';
import { Widget } from '@nuclia/core';

interface WidgetWithModel extends Widget.Widget {
  generativeModel?: string;
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

  modal = inject(ModalRef);

  defaultModel = this.sdk.currentKb.pipe(
    switchMap((kb) => kb.getConfiguration()),
    map((config) => config['generative_model'] || ''),
    shareReplay(1),
  );

  widgetList: Observable<WidgetWithModel[]> = combineLatest([
    this.searchWidgetService.widgetList,
    this.searchWidgetService.supportedSearchConfigurations,
    this.defaultModel,
  ]).pipe(
    map(([widgets, searchConfigs, defaultModel]) =>
      widgets.map((widget) => ({
        ...widget,
        generativeModel:
          searchConfigs.find((config) => config.id === widget.searchConfigId)?.generativeAnswer?.generativeModel ||
          defaultModel,
      })),
    ),
  );

  emptyList: Observable<boolean> = this.widgetList.pipe(map((list) => list.length === 0));

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

  /** Closes the modal, returning the widget's linked search configuration id so the panel can load it. */
  selectWidget(widget: Widget.Widget) {
    this.modal.close(widget.searchConfigId);
  }

  rename(slug: string, name: string) {
    this.searchWidgetService.renameWidget(slug, name).subscribe();
  }

  duplicateAsNew(widget: Widget.Widget) {
    this.searchWidgetService.duplicateWidget(widget).subscribe();
  }

  delete(slug: string, name: string) {
    this.searchWidgetService.deleteWidget(slug, name).subscribe();
  }
}
