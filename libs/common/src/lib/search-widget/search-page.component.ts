import { ChangeDetectionStrategy, Component, ElementRef, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SearchConfigurationComponent } from './search-configuration';
import { SearchWidgetService } from './search-widget.service';
import { SisModalService } from '@nuclia/sistema';
import { CreateWidgetDialogComponent } from './widgets';
import { filter, map, switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { DEFAULT_WIDGET_CONFIG, SearchConfiguration } from './search-widget.models';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'stf-search-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, SearchConfigurationComponent],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss', '_common-form.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SearchPageComponent {
  private sdk = inject(SDKService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);

  @ViewChild('configurationContainer') configurationContainerElement?: ElementRef;
  widgetPreview = this.searchWidgetService.widgetPreview;
  searchConfig?: SearchConfiguration;

  createWidget() {
    if (this.searchConfig) {
      const searchConfigId = this.searchConfig.id;
      const generativeModel = this.searchConfig.generativeAnswer.generativeModel;
      this.modalService
        .openModal(CreateWidgetDialogComponent)
        .onClose.pipe(
          filter((widgetName) => !!widgetName),
          map((widgetName) => widgetName as string),
          switchMap((widgetName) =>
            this.sdk.currentKb.pipe(
              take(1),
              map((kb) =>
                this.searchWidgetService.createWidget(
                  kb.id,
                  widgetName,
                  DEFAULT_WIDGET_CONFIG,
                  searchConfigId,
                  generativeModel,
                ),
              ),
              switchMap((widgetSlug) => this.router.navigate(['../widgets', widgetSlug], { relativeTo: this.route })),
            ),
          ),
        )
        .subscribe();
    }
  }

  updateConfig(config: SearchConfiguration) {
    this.searchConfig = config;
    this.searchWidgetService.generateWidgetSnippet(this.searchConfig).subscribe();
  }
}
