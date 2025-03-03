import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { AnswerGenerationComponent } from './answer-generation/answer-generation.component';
import { SummarizationComponent } from './summarization/summarization.component';
import { SemanticModelComponent } from './semantic-model/semantic-model.component';
import { AnonymizationComponent } from './anonymization/anonymization.component';
import { FeaturesService, SDKService, UnauthorizedFeatureDirective } from '@flaps/core';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { filter, forkJoin, map, of, Subject, take } from 'rxjs';
import { LearningConfigurations, WritableKnowledgeBox } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { removeDeprecatedModels } from './ai-models.utils';
import { StandaloneService } from '../services';
import { ExtractionComponent } from './extraction/extraction.component';

@Component({
  selector: 'stf-ai-models',
  imports: [
    CommonModule,
    PaButtonModule,
    PaExpanderModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    PaIconModule,
    PaTabsModule,
    AnswerGenerationComponent,
    SummarizationComponent,
    SemanticModelComponent,
    AnonymizationComponent,
    ExtractionComponent,
    InfoCardComponent,
    UnauthorizedFeatureDirective,
  ],
  templateUrl: './ai-models.component.html',
  styleUrl: './ai-models.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiModelsComponent implements OnInit {
  private unsubscribeAll = new Subject<void>();

  selectedTab: 'anonymization' | 'answer-generation' | 'semantic-model' | 'summarization' | 'extraction' =
    'answer-generation';

  kb?: WritableKnowledgeBox;
  learningConfigurations?: LearningConfigurations;
  kbConfigBackup?: { [key: string]: any };
  noKbConfig = false;

  isSummarizationAuthorized = this.features.authorized.summarization;
  isVectorsetAuthorized = this.features.authorized.vectorset;
  isAnonymizationAuthorized = this.features.authorized.anonymization;
  extractConfigEnabled = this.features.unstable.extractConfig;
  standalone = this.standaloneService.standalone;

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
    private standaloneService: StandaloneService,
  ) {}

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        tap((kb) => (this.kb = kb)),
        switchMap((kb) => forkJoin([kb.getConfiguration().pipe(catchError(() => of(null))), kb.getLearningSchema()])),
        filter(([kbConfig]) => {
          if (kbConfig === null) {
            this.noKbConfig = true;
          }
          return !!kbConfig;
        }),
        map(
          ([kbConfig, learningSchema]) =>
            ({ kbConfig, learningSchema }) as {
              kbConfig: { [id: string]: any };
              learningSchema: LearningConfigurations;
            },
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ kbConfig, learningSchema }) => {
        this.kbConfigBackup = kbConfig;
        this.learningConfigurations = removeDeprecatedModels(learningSchema);
        this.cdr.markForCheck();
      });
  }

  selectTab(tab: 'anonymization' | 'answer-generation' | 'semantic-model' | 'summarization' | 'extraction'): void {
    if (tab === 'summarization') {
      this.isSummarizationAuthorized
        .pipe(
          take(1),
          filter((authorized) => authorized),
        )
        .subscribe(() => (this.selectedTab = tab));
    } else if (tab === 'anonymization') {
      this.isAnonymizationAuthorized
        .pipe(
          take(1),
          filter((authorized) => authorized),
        )
        .subscribe(() => (this.selectedTab = tab));
    } else if (tab === 'semantic-model') {
      this.isVectorsetAuthorized
        .pipe(
          take(1),
          filter((authorized) => this.standalone || authorized),
        )
        .subscribe(() => (this.selectedTab = tab));
    } else {
      this.selectedTab = tab;
    }
  }
}
