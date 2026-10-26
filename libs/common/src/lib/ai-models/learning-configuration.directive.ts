import { ChangeDetectorRef, Directive, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FeaturesService, SDKService, UnauthorizedFeatureModalComponent } from '@flaps/core';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { GenerativeProviders, LearningConfigurations, WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';

@Directive({
  selector: '[stfLearningConfiguration]',
})
export abstract class LearningConfigurationDirective implements OnChanges {
  protected sdk = inject(SDKService);
  protected cdr = inject(ChangeDetectorRef);
  protected modal = inject(SisModalService);
  protected features = inject(FeaturesService);
  protected translate = inject(TranslateService);
  protected toaster = inject(SisToastService);

  @Input() learningConfigurations?: LearningConfigurations;
  @Input() kb?: WritableKnowledgeBox;
  @Input() kbConfigBackup?: { [key: string]: any };
  @Input() providers?: GenerativeProviders;

  // permissions
  isSummarizationAuthorized = this.features.authorized.summarization;

  protected saving = false;

  protected abstract resetForm(): void;
  protected abstract save(): void;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['learningConfigurations'] || changes['kbConfigBackup']) {
      this.resetForm();
    }
  }

  openUnauthorizedModal(feature: string) {
    this.modal.openModal(
      UnauthorizedFeatureModalComponent,
      new ModalConfig({ data: { feature: this.translate.instant(feature) } }),
    );
  }
}
