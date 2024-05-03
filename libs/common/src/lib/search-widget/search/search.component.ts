import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, distinctUntilKeyChanged, forkJoin, map, switchMap, take } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TrainingType } from '@nuclia/core';
import { DEFAULT_FEATURES_LIST } from '../widgets/widget-features';
import { BackendConfigurationService, FeaturesService, SDKService } from '@flaps/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ResourceViewerService } from '../../resources';
import { StandaloneService } from '../../services';
import { MODELS_SUPPORTING_VISION } from '../search-widget.models';

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
  searchWidget = combineLatest([
    this._answerToggle,
    this.sdk.currentKb.pipe(distinctUntilKeyChanged('id')),
    this.sdk.currentAccount,
  ]).pipe(
    tap(() => {
      document.getElementById(searchWidgetId)?.remove();
    }),
    switchMap(([toggleAnswerEnabled, kb, account]) =>
      forkJoin([
        kb.getLabels().pipe(map((labelSets) => Object.keys(labelSets).length > 0)),
        kb.training.hasModel(TrainingType.classifier),
        this.features.unstable.knowledgeGraph.pipe(take(1)),
        kb.getConfiguration(),
      ]).pipe(
        map(([hasLabels, hasClassifier, isKnowledgeGraphEnabled, config]) => ({
          kb,
          account,
          hasLabels,
          hasClassifier,
          isChatEnabled: toggleAnswerEnabled,
          isKnowledgeGraphEnabled,
          config,
        })),
      ),
    ),
    map(({ kb, account, hasLabels, hasClassifier, isChatEnabled, isKnowledgeGraphEnabled, config }) => {
      const isVisionModel = MODELS_SUPPORTING_VISION.includes(config['generative_model'] || '');
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
      if (isKnowledgeGraphEnabled) {
        features += ',knowledgeGraph';
      }
      let ragImagesStrategies: string[] = [];
      if (isVisionModel) {
        ragImagesStrategies = ['page_image|4', 'paragraph_image'];
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
    account="${account.id}"
    lang="${this.translation.currentLang}"
    features="${features}"
    ${ragImagesStrategies.length > 0 ? `rag_images_strategies="${ragImagesStrategies.join(',')}"` : ''}
  ></nuclia-search-bar>`);
    }),
  );
  searchResults = this.sanitized.bypassSecurityTrustHtml(
    `<nuclia-search-results id="${searchResultsId}"></nuclia-search-results>`,
  );

  standalone = this.standaloneService.standalone;
  hasValidKey = this.standaloneService.hasValidKey;

  constructor(
    private sdk: SDKService,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private translation: TranslateService,
    private viewerService: ResourceViewerService,
    private features: FeaturesService,
    private standaloneService: StandaloneService,
  ) {}

  ngOnInit() {
    this.viewerService.init(searchResultsId);
  }

  ngOnDestroy() {
    const searchBarElement = document.querySelector('nuclia-search-bar') as any;
    const searchResultsElement = document.querySelector('nuclia-search-results') as any;
    if (typeof searchBarElement?.$$c?.$destroy === 'function') {
      searchBarElement.$$c.$destroy();
    }
    if (typeof searchResultsElement?.$$c?.$destroy === 'function') {
      searchResultsElement.$$c.$destroy();
    }
  }

  toggleAnswer(enable: boolean) {
    this.enabledAnswer = enable;
    localStorage.setItem(ENABLE_GENERATIVE_ANSWER, `${enable}`);
    this._answerToggle.next(enable);
  }
}
