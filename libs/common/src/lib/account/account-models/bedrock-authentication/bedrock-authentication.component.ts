
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BedrockParameters, BedrockService, DEFAULT_IAM_POLICY, SDKService } from '@flaps/core';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SisModalService, SisProgressModule, SisToastService } from '@nuclia/sistema';
import { filter, switchMap, take } from 'rxjs';

@Component({
  imports: [
    AccordionComponent,
    AccordionBodyDirective,
    AccordionItemComponent,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    SisProgressModule,
    TranslateModule
],
  templateUrl: './bedrock-authentication.component.html',
  styleUrls: ['./bedrock-authentication.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedrockAuthenticatonComponent {
  sdk = inject(SDKService);
  bedrockService = inject(BedrockService);
  toaster = inject(SisToastService);
  modalService = inject(SisModalService);
  cdr = inject(ChangeDetectorRef);

  form = new FormGroup({
    arn: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  zone = this.modal.config.data?.zone;
  awsRegion = this.zone?.split('-').slice(1, -1).join('-') || '';
  params?: BedrockParameters;
  policy = JSON.stringify(DEFAULT_IAM_POLICY, null, 2);
  copied: { [key: string]: boolean } = {};
  saving = false;

  constructor(private modal: ModalRef<{ zone: string }>) {
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) => this.bedrockService.startAuthFlow(account.id, this.zone || '')),
      )
      .subscribe((params) => {
        this.params = params;
        this.cdr.markForCheck();
      });
  }

  copy(field: string, value: string) {
    navigator.clipboard.writeText(value);
    this.copied[field] = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copied[field] = false;
      this.cdr.markForCheck();
    }, 2000);
  }

  save() {
    this.saving = true;
    this.cdr.markForCheck();
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) =>
          this.bedrockService
            .finishAuthFlow(account.id, this.zone || '', {
              role_arn: this.form.getRawValue().arn,
            })
            .pipe(switchMap(() => this.bedrockService.getStatus(account.id, this.zone || ''))),
        ),
      )
      .subscribe({
        next: (res) => {
          if (res.status === 'active') {
            this.modal.close();
          } else {
            this.toaster.error('account.models.bedrock.error');
          }
          this.saving = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toaster.error('account.models.bedrock.error');
          this.saving = false;
          this.cdr.markForCheck();
        },
      });
  }

  cancel() {
    this.modalService
      .openConfirm({
        title: 'generic.warning',
        cancelLabel: 'generic.continue',
        confirmLabel: 'account.models.bedrock.leave-confirm.button',
        description: 'account.models.bedrock.leave-confirm.description',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => confirm),
        switchMap(() => this.sdk.currentAccount.pipe(take(1))),
        switchMap((account) => this.bedrockService.delete(account.id, this.zone || '')),
      )
      .subscribe(() => {
        this.modal.close();
      });
  }
}
