import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SisModalService, StickyFooterComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { ModalConfig, PaButtonModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, filter, switchMap, take, tap } from 'rxjs';
import { ExtractConfig, ExtractStrategies, LearningConfigurations } from '@nuclia/core';
import { SDKService } from '@flaps/core';
import { ExtractionModalComponent } from './extraction-modal/extraction-modal.component';

@Component({
  selector: 'stf-extraction',
  imports: [
    CommonModule,
    PaButtonModule,
    PaTableModule,
    StickyFooterComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
  ],
  templateUrl: './extraction.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionComponent {
  sdk = inject(SDKService);
  modalService = inject(SisModalService);
  translate = inject(TranslateService);

  @Input() learningConfigurations?: LearningConfigurations;
  strategies = new BehaviorSubject<ExtractStrategies | null>({});

  constructor() {
    this.updateStrategies().subscribe();
  }

  createStrategy() {
    this.modalService
      .openModal(
        ExtractionModalComponent,
        new ModalConfig({ data: { learningConfigurations: this.learningConfigurations } }),
      )
      .onClose.pipe(
        filter((data) => !!data),
        switchMap(({ name, config }) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.createExtractStrategy(name, config)),
          ),
        ),
        switchMap(() => this.updateStrategies()),
      )
      .subscribe();
  }

  deleteStrategy(id: string, event?: Event) {
    event?.stopPropagation();
    return this.modalService
      .openConfirm({
        title: 'kb.ai-models.extraction.delete.title',
        description: this.translate.instant('kb.ai-models.extraction.delete.description', { id }),
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sdk.currentKb),
        take(1),
        switchMap((kb) => kb.deleteExtractStrategy(id)),
        switchMap(() => this.updateStrategies()),
      )
      .subscribe();
  }

  updateStrategies() {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getExtractStrategies()),
      tap((strategies) => {
        this.strategies.next(strategies);
      }),
    );
  }

  displayStrategy(name: string, config: ExtractConfig) {
    this.modalService.openModal(
      ExtractionModalComponent,
      new ModalConfig({ data: { learningConfigurations: this.learningConfigurations, name, config } }),
    );
  }
}
