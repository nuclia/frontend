import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilKeyChanged, forkJoin, map, switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TrainingType } from '@nuclia/core';
import { DEFAULT_FEATURES_LIST } from '../widgets/widget-features';
import { BackendConfigurationService, SDKService, STFTrackingService } from '@flaps/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ResourceViewerService } from '../resources';
import { StandaloneService } from '../services';

const searchWidgetId = 'search-bar';
const searchResultsId = 'search-results';
const ENABLE_GENERATIVE_ANSWER = 'NUCLIA_ENABLE_GENERATIVE_ANSWER';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit, OnDestroy {
  enabledAnswer =
    !localStorage.getItem(ENABLE_GENERATIVE_ANSWER) || localStorage.getItem(ENABLE_GENERATIVE_ANSWER) === 'true';
  private _answerToggle = new BehaviorSubject<boolean>(this.enabledAnswer);
  searchWidget = combineLatest([this._answerToggle, this.sdk.currentKb.pipe(distinctUntilKeyChanged('id'))]).pipe(
    tap(() => {
      document.getElementById(searchWidgetId)?.remove();
    }),
    switchMap(([toggleAnswerEnabled, kb]) =>
      forkJoin([
        kb.getLabels().pipe(map((labelSets) => Object.keys(labelSets).length > 0)),
        kb.training.hasModel(TrainingType.classifier),
        this.tracking.isFeatureEnabled('answers'),
      ]).pipe(
        map(([hasLabels, hasClassifier, isChatEnabled]) => ({
          kb,
          hasLabels,
          hasClassifier,
          isChatEnabled: isChatEnabled && toggleAnswerEnabled,
        })),
      ),
    ),
    map(({ kb, hasLabels, hasClassifier, isChatEnabled }) => {
      let featureList = !hasLabels
        ? DEFAULT_FEATURES_LIST.filter((feature) => feature !== 'filter')
        : DEFAULT_FEATURES_LIST;

      let features = featureList.join(',');
      if (hasClassifier) {
        features += ',suggestLabels';
      }
      if (isChatEnabled) {
        features += ',answers';
      }
      const zone = this.sdk.nuclia.options.standalone ? `standalone="true"` : `zone="${this.sdk.nuclia.options.zone}"`;
      return this.sanitized.bypassSecurityTrustHtml(`<nuclia-search-bar id="${searchWidgetId}"
    knowledgebox="${kb.id}"
    ${zone}
    client="dashboard"
    cdn="${this.backendConfig.getCDN() ? this.backendConfig.getCDN() + '/' : ''}"
    backend="${this.backendConfig.getAPIURL()}"
    state="${kb.state || ''}"
    kbslug="${kb.slug || ''}"
    account="${kb.account || ''}"
    lang="${this.translation.currentLang}"
    features="${features}"
  ></nuclia-search-bar>`);
    }),
  );
  searchResults = this.sanitized.bypassSecurityTrustHtml(
    `<nuclia-search-results id="${searchResultsId}"></nuclia-search-results>`,
  );

  standalone = this.standaloneService.standalone;
  hasValidKey = this.standaloneService.hasValidKey.pipe(tap(console.log));

  constructor(
    private sdk: SDKService,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private translation: TranslateService,
    private viewerService: ResourceViewerService,
    private tracking: STFTrackingService,
    private standaloneService: StandaloneService,
  ) {}

  ngOnInit() {
    this.viewerService.init(searchResultsId);
  }

  ngOnDestroy() {
    const searchBarElement = document.querySelector('nuclia-search-bar') as any;
    const searchResultsElement = document.querySelector('nuclia-search-results') as any;
    if (typeof searchBarElement?.$destroy === 'function') {
      searchBarElement.$destroy();
    }
    if (typeof searchResultsElement?.$destroy === 'function') {
      searchResultsElement.$destroy();
    }
  }

  toggleAnswer(enable: boolean) {
    this.enabledAnswer = enable;
    localStorage.setItem(ENABLE_GENERATIVE_ANSWER, `${enable}`);
    this._answerToggle.next(enable);
  }
}
