import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SearchConfigurationComponent } from './search-configuration';
import { SearchWidgetService } from './search-widget.service';
import { SisModalService } from '@nuclia/sistema';
import { CreateWidgetDialogComponent } from './widgets';
import { filter, map, switchMap } from 'rxjs';
import { DEFAULT_WIDGET_CONFIG, SearchConfiguration } from './search-widget.models';
import { ActivatedRoute, Router } from '@angular/router';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-search-page',
  standalone: true,
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
      const vectorset = this.searchConfig.generativeAnswer.vectorset;
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
    this.searchWidgetService.generateWidgetSnippet(this.searchConfig);
  }
}
