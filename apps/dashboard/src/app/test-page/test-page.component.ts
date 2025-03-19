import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DEFAULT_WIDGET_CONFIG, NUCLIA_STANDARD_SEARCH_CONFIG, SearchWidgetService } from '@flaps/common';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { map, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-test-page',
  imports: [CommonModule, TranslateModule, PaButtonModule, PaTextFieldModule],
  templateUrl: './test-page.component.html',
  styleUrl: './test-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestPageComponent {
  widgets = this.searchWidgetService.widgetList;
  searchConfigs = this.searchWidgetService.searchConfigurations;
  widgetPreview = this.searchWidgetService.widgetPreview;
  kb = this.sdk.currentKb;
  private backendConfig = inject(BackendConfigurationService);
  assetsPath = this.backendConfig.getAssetsPath();
  brandName = this.backendConfig.getBrandName();

  selected?: string;
  darkMode = false;

  constructor(
    private sdk: SDKService,
    private searchWidgetService: SearchWidgetService,
  ) {
    this.widgets.pipe(take(1)).subscribe((widgets) => {
      if (widgets.length === 0) {
        this.searchWidgetService.generateWidgetSnippet(NUCLIA_STANDARD_SEARCH_CONFIG, DEFAULT_WIDGET_CONFIG);
      } else if (widgets.length === 1) {
        this.selected = widgets[0].slug;
        this.showWidget(this.selected);
      }
    });
  }

  showWidget(widgetSlug: string) {
    if (!widgetSlug) return;
    this.widgets
      .pipe(
        take(1),
        map((widgets) => widgets.find((widget) => widget.slug === widgetSlug)),
        switchMap((widget) =>
          this.searchConfigs.pipe(
            take(1),
            map((configs) => configs.find((config) => config.id === widget?.searchConfigId || '')),
            map((config) => ({ widget, config })),
          ),
        ),
      )
      .subscribe(({ widget, config }) => {
        this.searchWidgetService.generateWidgetSnippet(config || NUCLIA_STANDARD_SEARCH_CONFIG, widget?.widgetConfig);
        this.darkMode = widget?.widgetConfig.darkMode === 'dark';
      });
  }
}
