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
import { LearningOptionPipe } from '../pipes';
import { AnswerGenerationComponent } from './answer-generation/answer-generation.component';
import { SummarizationComponent } from './summarization/summarization.component';
import { SemanticModelComponent } from './semantic-model/semantic-model.component';
import { AnonymizationComponent } from './anonymization/anonymization.component';
import { FeaturesService, SDKService } from '@flaps/core';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { forkJoin, of, Subject } from 'rxjs';
import { LearningConfigurations, WritableKnowledgeBox } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'stf-ai-models',
  standalone: true,
  imports: [
    CommonModule,
    LearningOptionPipe,
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
    InfoCardComponent,
  ],
  templateUrl: './ai-models.component.html',
  styleUrl: './ai-models.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiModelsComponent implements OnInit {
  private unsubscribeAll = new Subject<void>();

  selectedTab: 'anonymization' | 'answer-generation' | 'semantic-model' | 'summarization' = 'answer-generation';

  kb?: WritableKnowledgeBox;
  learningConfigurations?: LearningConfigurations;
  kbConfigBackup?: { [key: string]: any };
  noKbConfig = false;

  isSummarizationEnabled = this.features.summarization;
  isAnonymizationEnabled = this.features.kbAnonymization;

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private features: FeaturesService,
  ) {}

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        tap((kb) => (this.kb = kb)),
        switchMap((kb) => forkJoin([kb.getConfiguration().pipe(catchError(() => of(null))), kb.getLearningSchema()])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(([kbConfig, learningSchema]) => {
        if (kbConfig === null) {
          this.noKbConfig = true;
        } else {
          this.kbConfigBackup = kbConfig;
          this.learningConfigurations = learningSchema;
        }
        this.cdr.markForCheck();
      });
  }
}
