import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  QueryList,
  OnDestroy,
  ViewChildren,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SDKService } from '@flaps/core';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  filter,
  map,
  Observable,
  of,
  ReplaySubject,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { KnowledgeBox, LearningConfigurations, NucliaTokensDetails, UsagePoint } from '@nuclia/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaExpanderModule,
  PaIconModule,
  PaTableModule,
  PaTextFieldModule,
  PaPopupModule,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent } from '@nuclia/sistema';
import { MetricsService } from '../metrics.service';

const groups = {
  processing: ['sentence', 'extract_tables', 'vllm_extraction', 'token', 'relations'],
  summarization: ['summarize'],
  answers: ['question_answer', 'rephrase', 'rerank'],
  suggestions: ['suggestions'],
  searches: ['searches'],
};

interface NucliaTokensDetailsEnhanced extends NucliaTokensDetails {
  total: number;
  counters: { [key: string]: number };
  modelName?: string;
  totalRequests: number;
  average: number;
  help?: string;
}

@Component({
  selector: 'app-nuclia-tokens',
  templateUrl: './nuclia-tokens.component.html',
  styleUrls: ['./nuclia-tokens.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AccordionComponent,
    AccordionBodyDirective,
    AccordionItemComponent,
    CommonModule,
    InfoCardComponent,
    PaExpanderModule,
    PaIconModule,
    PaTableModule,
    PaTextFieldModule,
    PaPopupModule,
    TranslateModule,
  ],
})
export class NucliaTokensComponent implements OnDestroy {
  private unsubscribeAll = new Subject<void>();

  @Input() set usage(value: { [key: string]: UsagePoint[] } | undefined) {
    if (value) {
      this.usageSubject.next(value);
      this.loading = false;
    }
  }

  @Input() selectedPeriod: { start: Date; end: Date } | null = null;
  @Output() selectPeriod = new EventEmitter<{ start: Date; end: Date }>();

  @ViewChildren(AccordionItemComponent) accordionItems?: QueryList<AccordionItemComponent>;

  loading = true;
  digitsInfo = '1.0-0';
  kbList = this.sdk.kbList;
  selectedKb = new BehaviorSubject<string>('account');
  usageSubject = new ReplaySubject<{ [key: string]: UsagePoint[] }>(1);
  isSubscribedToStripe = this.metrics.isSubscribedToStripe;
  periods = combineLatest([this.isSubscribedToStripe, this.metrics.period]).pipe(
    map(([isSubscribed, period]) =>
      isSubscribed ? this.metrics.getLastStripePeriods(period, 6) : this.metrics.getLastMonths(6),
    ),
  );

  schema = this.sdk.currentAccount.pipe(
    switchMap((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account.slug, account.id)),
    switchMap((kbs) => {
      if (kbs.length === 0) {
        return of({} as LearningConfigurations);
      }
      const kb = new KnowledgeBox(this.sdk.nuclia, '', kbs[0]);
      this.sdk.nuclia.options.zone = kb.zone;
      return kb.getLearningSchema();
    }),
    shareReplay(1),
  );

  details: Observable<NucliaTokensDetailsEnhanced[]> = combineLatest([
    this.selectedKb,
    this.usageSubject,
    this.schema,
  ]).pipe(
    filter(([kb, usage]) => !!usage[kb]),
    map(([kb, usage, schema]) => {
      const details = (usage[kb][0].metrics.find((metric) => metric.name === 'nuclia_tokens')?.details ||
        []) as NucliaTokensDetails[];
      const models = schema['generative_model']?.options || [];
      return details
        .map((detail) => {
          const helpTextKey = 'account.nuclia-tokens.help.' + detail.identifier.type;
          const enhancedDetail = {
            ...detail,
            total: Object.values(detail.nuclia_tokens_billed).reduce(
              (acc: number, curr) => (acc || 0) + (curr || 0),
              0,
            ),
            counters: Object.entries(detail.nuclia_tokens_billed)
              .filter(([, value]) => value !== null && value !== 0)
              .map((data) => data as [string, number])
              .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as { [key: string]: number }),
            modelName:
              models.find((model) => model.value === detail.identifier.model)?.name ||
              detail.identifier.model ||
              undefined,
            totalRequests: Object.values(detail.requests).reduce((acc: number, curr) => acc + (curr || 0), 0),
            average: 0,
            help: this.translate.instant(helpTextKey) !== helpTextKey ? this.translate.instant(helpTextKey) : undefined,
          };
          if (enhancedDetail.totalRequests > 0) {
            enhancedDetail.average = enhancedDetail.total / enhancedDetail.totalRequests;
          }
          return enhancedDetail;
        })
        .filter((detail) => detail.total > 0); // Hide details with 0 tokens
    }),
  );

  visibleGroups = this.details.pipe(
    map((details) => {
      const types = Object.values(groups).reduce((acc, curr) => acc.concat(curr), []);
      const otherDetails = details.filter((detail) => !types.includes(detail.identifier.type));
      return Object.entries(groups)
        .map(([key, types]) => {
          const groupDetails = types.reduce(
            (acc, type) => acc.concat(details.filter((detail) => detail.identifier.type === type)),
            [] as NucliaTokensDetailsEnhanced[],
          );
          return {
            title: key,
            details: groupDetails,
            total: groupDetails.reduce((acc, curr) => acc + curr.total, 0),
          };
        })
        .concat([
          {
            title: 'other',
            details: otherDetails,
            total: otherDetails.reduce((acc, curr) => acc + curr.total, 0),
          },
        ])
        .filter((group) => group.details.length > 0);
    }),
  );

  totalTokens = this.usageSubject.pipe(
    map((usage) => usage['account'][0].metrics.find((metric) => metric.name === 'nuclia_tokens_billed')?.value || 0),
  );

  constructor(
    private sdk: SDKService,
    private metrics: MetricsService,
    private translate: TranslateService,
  ) {
    this.visibleGroups.pipe(takeUntil(this.unsubscribeAll), delay(10)).subscribe(() => {
      this.accordionItems?.forEach((item) => {
        item.updateContentHeight();
      });
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
