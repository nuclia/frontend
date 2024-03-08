import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SDKService, STFUtils, Zone } from '@flaps/core';
import { Account } from '@nuclia/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisProgressModule, SisToastService } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { LanguageFieldComponent } from '@nuclia/user';
import { KbConfig, KbCreationFormComponent, LearningConfig } from './kb-creation-form/kb-creation-form.component';
import * as Sentry from '@sentry/angular';

export interface KbAddData {
  account: Account;
  zones: Zone[];
}

@Component({
  imports: [
    CommonModule,
    LanguageFieldComponent,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    SisProgressModule,
    TranslateModule,
    KbCreationFormComponent,
  ],
  standalone: true,
  templateUrl: './kb-add-modal.component.html',
  styleUrl: './kb-add-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbAddModalComponent implements OnInit {
  saving = false;
  creationInProgress = false;
  failures = 0;
  account?: Account;
  zones: Zone[] = [];

  kbConfig?: KbConfig;
  learningConfig?: LearningConfig;

  constructor(
    public modal: ModalRef<KbAddData>,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private toast: SisToastService,
  ) {}

  ngOnInit(): void {
    this.account = this.modal.config.data?.account;
    this.zones = this.modal.config.data?.zones || [];
  }

  updateKbConfig($event: KbConfig) {
    this.kbConfig = $event;
  }
  updateLearningConfig($event: LearningConfig) {
    this.learningConfig = $event;
  }

  save() {
    if (!this.account || !this.kbConfig || !this.learningConfig) {
      return;
    }

    this.saving = true;
    const accountId = this.account.id;
    const inProgressTimeout = setTimeout(() => (this.creationInProgress = true), 500);
    this.cdr.markForCheck();

    this.sdk.nuclia.db
      .createKnowledgeBox(
        accountId,
        {
          ...this.kbConfig,
          slug: STFUtils.generateSlug(this.kbConfig.title),
          learning_configuration: this.learningConfig,
        },
        this.kbConfig.zone,
      )
      .subscribe({
        next: (kb) => {
          clearTimeout(inProgressTimeout);
          this.modal.close({ success: true, kbSlug: kb.slug, accountSlug: this.account?.slug });
        },
        error: () => {
          clearTimeout(inProgressTimeout);
          this.failures += 1;
          this.saving = false;
          this.creationInProgress = false;
          if (this.failures < 4) {
            this.toast.error('kb.create.error');
          } else {
            Sentry.captureMessage(`KB creation failed`, { tags: { host: location.hostname } });
            this.modal.close({ success: false });
          }
          this.cdr.markForCheck();
        },
      });
  }

  close(): void {
    this.modal.close();
  }
}
