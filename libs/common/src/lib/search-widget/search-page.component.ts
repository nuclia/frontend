import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Widget } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { filter, map, switchMap } from 'rxjs';
import { SearchConfigurationComponent } from './search-configuration';
import { DEFAULT_WIDGET_CONFIG } from './search-widget.models';
import { SearchWidgetService } from './search-widget.service';
import { CreateWidgetDialogComponent } from './widgets';

@Component({
  selector: 'stf-search-page',
  imports: [CommonModule, TranslateModule, SearchConfigurationComponent, PaIconModule, PaButtonModule],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss', '_common-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SearchPageComponent implements OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);
  private document = inject(DOCUMENT);

  configurationContainerElement = viewChild<ElementRef>('configurationContainer');
  searchConfigurationComponent = viewChild(SearchConfigurationComponent);

  widgetPreview = this.searchWidgetService.widgetPreview;
  searchConfig?: Widget.AnySearchConfiguration;

  configPanelCollapsed = false;

  minPanelWidth = 320;
  panelWidth = signal(480);
  configPanelWidth = computed(() => `${this.panelWidth()}px`);

  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }

  createWidget() {
    if (this.searchConfig?.type === 'config') {
      const searchConfigId = this.searchConfig.id;
      const generativeModel = this.searchConfig.generativeAnswer.generativeModel;
      const vectorset = this.searchConfig.searchBox.vectorset;
      this.modalService
        .openModal(CreateWidgetDialogComponent)
        .onClose.pipe(
          filter((widgetName) => !!widgetName),
          map((widgetName) => widgetName as string),
          switchMap((widgetName) =>
            this.searchWidgetService.createWidget(
              widgetName,
              DEFAULT_WIDGET_CONFIG,
              searchConfigId,
              generativeModel,
              vectorset,
            ),
          ),
          switchMap((widgetSlug) => this.router.navigate(['../widgets', widgetSlug], { relativeTo: this.route })),
        )
        .subscribe();
    }
  }

  updateConfig(config: Widget.AnySearchConfiguration) {
    this.searchConfig = config;
    this.searchWidgetService.generateWidgetSnippet(
      this.searchConfig,
      undefined,
      undefined,
      '.search-preview-container',
    );
  }

  startResizePanel(event: MouseEvent) {
    event.preventDefault();
    const mouseX = event.clientX;
    const lastWidth = this.panelWidth();

    const duringResize = (e: MouseEvent) => {
      const width = lastWidth + (mouseX - e.clientX);
      this.panelWidth.set(Math.max(width, this.minPanelWidth));
    };
    const finishResize = (e: MouseEvent) => {
      this.document.removeEventListener('mousemove', duringResize);
      this.document.removeEventListener('mouseup', finishResize);
      this.searchConfigurationComponent()?.updateHeight();
    };
    this.document.addEventListener('mousemove', duringResize);
    this.document.addEventListener('mouseup', finishResize);
  }
}
