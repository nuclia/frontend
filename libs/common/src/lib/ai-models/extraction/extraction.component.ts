import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SisModalService, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { ModalConfig, PaButtonModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, filter, switchMap, take, tap } from 'rxjs';
import {
  ExtractConfig,
  ExtractStrategies,
  GenerativeProviders,
  LearningConfigurations,
  SplitStrategies,
  SplitStrategy,
} from '@nuclia/core';
import { FeaturesService, SDKService } from '@flaps/core';
import { ExtractionModalComponent } from './extraction-modal/extraction-modal.component';
import { SplitModalComponent } from './split-modal/split-modal.component';

@Component({
  selector: 'stf-extraction',
  imports: [CommonModule, PaButtonModule, PaTableModule, TranslateModule, TwoColumnsConfigurationItemComponent],
  templateUrl: './extraction.component.html',
  styleUrls: ['./extraction.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionComponent {
  sdk = inject(SDKService);
  modalService = inject(SisModalService);
  translate = inject(TranslateService);
  features = inject(FeaturesService);

  @Input() providers?: GenerativeProviders;
  @Input() learningConfigurations?: LearningConfigurations;
  extractStrategies = new BehaviorSubject<ExtractStrategies | null>({});
  splitStrategies = new BehaviorSubject<SplitStrategies>({});
  splitStrategiesEnabled = this.features.authorized.splitConfig;

  constructor() {
    this.updateExtractStrategies().subscribe();
    this.splitStrategiesEnabled
      .pipe(
        filter((enabled) => enabled),
        switchMap(() => this.updateSplitStrategies()),
      )
      .subscribe();
  }

  createExtractStrategy() {
    this.modalService
      .openModal(
        ExtractionModalComponent,
        new ModalConfig({ data: { providers: this.providers, learningConfigurations: this.learningConfigurations } }),
      )
      .onClose.pipe(
        filter((data) => !!data),
        switchMap((config) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.createExtractStrategy(config)),
          ),
        ),
        switchMap(() => this.updateExtractStrategies()),
      )
      .subscribe();
  }

  deleteExtractStrategy(id: string, config: ExtractConfig, event?: Event) {
    event?.stopPropagation();
    return this.confirmDelete(config.name || '')
      .pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sdk.currentKb),
        take(1),
        switchMap((kb) => kb.deleteExtractStrategy(id)),
        switchMap(() => this.updateExtractStrategies()),
      )
      .subscribe();
  }

  updateExtractStrategies() {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getExtractStrategies()),
      tap((strategies) => {
        this.extractStrategies.next(strategies);
      }),
    );
  }

  displayExtractStrategy(id: string, config: ExtractConfig) {
    this.modalService.openModal(
      ExtractionModalComponent,
      new ModalConfig({
        data: { providers: this.providers, learningConfigurations: this.learningConfigurations, id, config },
      }),
    );
  }

  createSplitStrategy() {
    this.modalService
      .openModal(
        SplitModalComponent,
        new ModalConfig({ data: { providers: this.providers, learningConfigurations: this.learningConfigurations } }),
      )
      .onClose.pipe(
        filter((data) => !!data),
        switchMap((config) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.createSplitStrategy(config)),
          ),
        ),
        switchMap(() => this.updateSplitStrategies()),
      )
      .subscribe();
  }

  deleteSplitStrategy(id: string, strategy: SplitStrategy, event?: Event) {
    event?.stopPropagation();
    return this.confirmDelete(strategy.name || '')
      .pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sdk.currentKb),
        take(1),
        switchMap((kb) => kb.deleteSplitStrategy(id)),
        switchMap(() => this.updateSplitStrategies()),
      )
      .subscribe();
  }

  updateSplitStrategies() {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getSplitStrategies()),
      tap((strategies) => {
        this.splitStrategies.next(strategies);
      }),
    );
  }

  displaySplitStrategy(id: string, strategy: SplitStrategy) {
    this.modalService.openModal(
      SplitModalComponent,
      new ModalConfig({
        data: { providers: this.providers, learningConfigurations: this.learningConfigurations, id, config: strategy },
      }),
    );
  }

  private confirmDelete(name: string) {
    return this.modalService.openConfirm({
      title: 'kb.ai-models.extraction.delete',
      description: this.translate.instant('kb.ai-models.extraction.delete-confirm', { name }),
      confirmLabel: 'generic.delete',
      isDestructive: true,
    }).onClose;
  }
}
