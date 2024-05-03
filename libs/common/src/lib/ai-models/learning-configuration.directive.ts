import { ChangeDetectorRef, Directive, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LearningConfigurations, WritableKnowledgeBox } from '@nuclia/core';
import { FeaturesService, SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { UnauthorizedFeatureModalComponent } from '../../../../core/src/lib/unauthorized-feature/unauthorized-feature-modal.component';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';

@Directive({
  selector: '[stfLearningConfiguration]',
  standalone: true,
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
  @Input() unsupportedModels: string[] = [];
  @Input() unAuthorizedModels: string[] = [];

  // permissions
  isEnterpriseOrGrowth = this.features.isEnterpriseOrGrowth;
  isSummarizationAuthorized = this.features.authorized.summarization;
  isUserPromptsAuthorized = this.features.authorized.userPrompts;

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
