import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { distinctUntilKeyChanged, map, switchMap, tap } from 'rxjs';
import { DEFAULT_FEATURES_LIST } from '../widgets/widget-features';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ResourceViewerService } from '../resources/resource-viewer.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements AfterViewInit {
  searchWidget = this.sdk.currentKb.pipe(
    distinctUntilKeyChanged('id'),
    tap(() => {
      document.getElementById('search-widget')?.remove();
    }),
    switchMap((kb) => kb.getLabels().pipe(map((labelSets) => ({ kb, labelSets })))),
    map(({ kb, labelSets }) => {
      const hasLabels = Object.keys(labelSets).length > 0;
      const features = !hasLabels
        ? DEFAULT_FEATURES_LIST.split(',')
            .filter((feature) => feature !== 'filter')
            .join(',')
        : DEFAULT_FEATURES_LIST;
      return this.sanitized.bypassSecurityTrustHtml(`<nuclia-search id="search-widget" knowledgebox="${kb.id}"
        zone="${this.sdk.nuclia.options.zone}"
        client="dashboard"
        cdn="${this.backendConfig.getCDN() ? this.backendConfig.getCDN() + '/' : ''}"
        backend="${this.backendConfig.getAPIURL()}"
        state="${kb.state || ''}"
        kbslug="${kb.slug || ''}"
        account="${kb.account || ''}"
        lang="${this.translation.currentLang}"
        type="embedded"
        features="${features}"></nuclia-search>`);
    }),
  );

  constructor(
    private router: Router,
    private sdk: SDKService,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private translation: TranslateService,
    private resourceViewer: ResourceViewerService,
  ) {}

  ngAfterViewInit(): void {
    this.resourceViewer.init('search-widget');
  }
}
