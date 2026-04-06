import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BedrockService, SDKService } from '@flaps/core';
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
import { AssumeRoleInfo } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { filter } from 'rxjs';

@Component({
  imports: [
    AccordionComponent,
    AccordionBodyDirective,
    AccordionItemComponent,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './assume-role-modal.component.html',
  styleUrls: ['./assume-role-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssumeRoleModalComponent {
  sdk = inject(SDKService);
  bedrockService = inject(BedrockService);
  toaster = inject(SisToastService);
  modalService = inject(SisModalService);
  cdr = inject(ChangeDetectorRef);

  form = new FormGroup({
    arn: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  params = this.modal.config.data?.params;
  policy = JSON.stringify(this.modal.config.data?.policy, null, 2);
  policyHelp = this.modal.config.data?.policyHelp;
  title = this.modal.config.data?.title;
  isBedrock = this.modal.config.data?.isBedrock;

  copied: { [key: string]: boolean } = {};

  constructor(
    private modal: ModalRef<{
      params: AssumeRoleInfo;
      policy: object;
      policyHelp: string;
      title: string;
      isBedrock: boolean;
    }>,
  ) {}

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
    this.modal.close(this.form.getRawValue().arn);
  }

  cancel() {
    if (this.isBedrock) {
      this.modalService
        .openConfirm({
          title: 'generic.warning',
          cancelLabel: 'generic.continue',
          confirmLabel: 'account.assume-role.leave-confirm.button',
          description: 'account.assume-role.leave-confirm.description',
          isDestructive: true,
        })
        .onClose.pipe(filter((confirm) => confirm))
        .subscribe(() => {
          this.modal.close();
        });
    } else {
      this.modal.close();
    }
  }
}
