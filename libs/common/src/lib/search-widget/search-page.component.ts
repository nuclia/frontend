import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SisModalService } from '@nuclia/sistema';
import { filter, map, switchMap } from 'rxjs';
import { SearchConfigurationComponent } from './search-configuration';
import { DEFAULT_WIDGET_CONFIG, SearchConfiguration } from './search-widget.models';
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

  @ViewChild('configurationContainer') configurationContainerElement?: ElementRef;
  widgetPreview = this.searchWidgetService.widgetPreview;
  searchConfig?: SearchConfiguration;

  configPanelCollapsed = false;

  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }

  createWidget() {
    if (this.searchConfig) {
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

  updateConfig(config: SearchConfiguration) {
    this.searchConfig = config;
    this.searchWidgetService.generateWidgetSnippet(this.searchConfig, undefined, '.search-preview-container');
  }
}
