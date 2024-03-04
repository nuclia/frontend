import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HelpCardComponent, SisToastService } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { KbConfig, KbCreationFormComponent, LearningConfig } from '@flaps/common';
import { SDKService, STFUtils, Zone, ZoneService } from '@flaps/core';
import { WritableKnowledgeBox } from '@nuclia/core';

@Component({
  selector: 'app-step3-kb',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HelpCardComponent,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    KbCreationFormComponent,
  ],
  templateUrl: './step3-kb.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step3KbComponent implements OnInit {
  @Input() accountId = '';

  @Output() back = new EventEmitter<void>();
  @Output() kbCreated = new EventEmitter<WritableKnowledgeBox>();

  creationInProgress = false;

  kbConfig?: KbConfig;
  learningConfig?: LearningConfig;
  invalidKbConfig = true;

  saving = false;
  // TODO: filter out zones which are not on AWS provider
  zones: Zone[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private zoneService: ZoneService,
    private toast: SisToastService,
  ) {}

  ngOnInit() {
    if (!this.sdk.nuclia.options.standalone) {
      this.zoneService.getZones().subscribe((zones) => {
        this.zones = zones;
        this.cdr.markForCheck();
      });
    }
  }

  updateKbConfig(kbConfig: KbConfig) {
    this.kbConfig = kbConfig;
    this.invalidKbConfig = !kbConfig.title || !kbConfig.zone;
    this.cdr.markForCheck();
  }
  updateLearningConfig($event: LearningConfig) {
    this.learningConfig = $event;
    this.cdr.markForCheck();
  }

  createKb() {
    if (!this.kbConfig || !this.learningConfig) {
      return;
    }

    this.saving = true;
    this.sdk.nuclia.db
      .createKnowledgeBox(
        this.accountId,
        {
          ...this.kbConfig,
          slug: STFUtils.generateSlug(this.kbConfig.title),
          learning_configuration: this.learningConfig,
        },
        this.kbConfig.zone,
      )
      .subscribe({
        next: (kb) => {
          this.saving = false;
          this.kbCreated.emit(kb);
          this.cdr.markForCheck();
        },
        error: () => {
          this.saving = false;
          this.toast.error('kb.create.error');
          this.cdr.markForCheck();
        },
      });
  }
}
