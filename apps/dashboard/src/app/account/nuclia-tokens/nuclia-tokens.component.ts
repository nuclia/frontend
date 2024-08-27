import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  QueryList,
  OnDestroy,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SDKService } from '@flaps/core';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { KnowledgeBox, LearningConfigurations, NucliaTokensDetails } from '@nuclia/core';
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
import { MetricsService } from '../metrics.service';
import { InfoCardComponent } from '@nuclia/sistema';

const groups = {
  processing: ['sentence', 'extract_tables', 'token', 'relations'],
  summarization: ['summarize'],
  answers: ['question_answer', 'rephrase', 'rerank'],
  suggestions: ['suggestions'],
  searches: ['searches'],
};

interface NucliaTokensDetailsEnhanced extends NucliaTokensDetails {
  total: number;
  counters: { [key: string]: number };
  modelName?: string;
  help?: string;
}

@Component({
  selector: 'app-nuclia-tokens',
  templateUrl: './nuclia-tokens.component.html',
  styleUrls: ['./nuclia-tokens.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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

  @ViewChildren(AccordionItemComponent) accordionItems?: QueryList<AccordionItemComponent>;

  loading = true;
  digitsInfo = '1.0-0';
  kbList = this.sdk.kbList;
  selectedKb = new BehaviorSubject<string>('all');

  period = this.metricsService.isSubscribed.pipe(
    switchMap((isSubscribed) =>
      isSubscribed ? this.metricsService.subscriptionPeriod : of(this.metricsService.last30Days),
    ),
    map((period) => period || this.metricsService.last30Days),
  );

  usage = combineLatest([this.sdk.currentAccount.pipe(take(1)), this.period.pipe(take(1)), this.selectedKb]).pipe(
    tap(() => {
      this.loading = true;
    }),
    switchMap(([account, period, selectedKb]) => {
      const to = new Date();
      const kb = selectedKb === 'all' ? undefined : selectedKb;
      return this.sdk.nuclia.db.getUsage(account.id, period.start.toISOString(), to.toISOString(), kb);
    }),
    shareReplay(1),
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

  details: Observable<NucliaTokensDetailsEnhanced[]> = combineLatest([this.usage, this.schema]).pipe(
    map(([usage, schema]) => {
      const details = (usage[0].metrics.find((metric) => metric.name === 'nuclia_tokens')?.details ||
        []) as NucliaTokensDetails[];
      const models = schema['generative_model']?.options || [];
      return details
        .map((detail) => {
          const helpTextKey = 'account.nuclia-tokens.help.' + detail.identifier.type;
          return {
            ...detail,
            total: Object.values(detail.nuclia_tokens).reduce((acc: number, curr) => (acc || 0) + (curr || 0), 0),
            counters: Object.entries(detail.nuclia_tokens)
              .filter(([, value]) => value !== null && value !== 0)
              .map((data) => data as [string, number])
              .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as { [key: string]: number }),
            modelName:
              models.find((model) => model.value === detail.identifier.model)?.name ||
              detail.identifier.model ||
              undefined,
            help: this.translate.instant(helpTextKey) !== helpTextKey ? this.translate.instant(helpTextKey) : undefined,
          };
        })
        .filter((detail) => detail.total >= 1); // Hide details having less than 1 token
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
            displayModel: groupDetails.some((detail) => !!detail.identifier.model),
            total: groupDetails.reduce((acc, curr) => acc + curr.total, 0),
          };
        })
        .concat([
          {
            title: 'other',
            details: otherDetails,
            displayModel: otherDetails.some((detail) => !!detail.identifier.model),
            total: otherDetails.reduce((acc, curr) => acc + curr.total, 0),
          },
        ])
        .filter((group) => group.details.length > 0);
    }),
  );

  totalTokens = this.details.pipe(
    take(1),
    map((details) => details.reduce((acc, curr) => acc + (curr.total || 0), 0)),
  );

  constructor(
    private sdk: SDKService,
    private metricsService: MetricsService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.visibleGroups.pipe(takeUntil(this.unsubscribeAll), delay(10)).subscribe(() => {
      this.accordionItems?.forEach((item) => {
        item.updateContentHeight();
      });
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
