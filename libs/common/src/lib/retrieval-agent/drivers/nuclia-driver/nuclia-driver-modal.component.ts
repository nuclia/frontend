import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SDKService } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DriverCreation, IKnowledgeBoxItem, NucliaDBConfig, NucliaDBDriver } from '@nuclia/core';
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { filter, map, of, switchMap, take } from 'rxjs';
import { ExpirationModalComponent } from '../../../token-dialog/expiration-modal.component';

@Component({
  selector: 'app-nuclia-driver-modal',
  imports: [
    CommonModule,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    InfoCardComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './nuclia-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NucliaDriverModalComponent {
  private sdk = inject(SDKService);
  private modalService = inject(SisModalService);

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    kbid: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    key: new FormControl<string>(''),
    keepExistingKey: new FormControl<boolean>(false, { nonNullable: true }),
  });
  isEdit: boolean;

  get keyControl() {
    return this.form.controls.key;
  }
  get keepExistingKey() {
    return this.form.controls.keepExistingKey.getRawValue();
  }

  get config() {
    return this.modal.config.data?.driver;
  }
  get kbList() {
    return this.modal.config.data?.kbList || [];
  }
  get kb() {
    return this.kbList.find((kb) => kb.id === this.form.controls.kbid.getRawValue());
  }

  private existingKey?: string;

  constructor(public modal: ModalRef<{ driver: NucliaDBDriver; kbList: IKnowledgeBoxItem[] }>) {
    const data = this.modal.config.data;
    this.isEdit = !!data?.driver;
    if (data?.driver) {
      this.existingKey = data.driver.config.key;
      this.form.patchValue({
        name: data.driver.name,
        kbid: data.driver.config.kbid,
        description: data.driver.config.description,
        keepExistingKey: true,
      });
    }
  }

  checkFormValidators(roleOnKb?: string) {
    if (roleOnKb === 'SOWNER') {
      // The key is generated for owners, so we don't need a validator in this case
      this.keyControl.clearValidators();
    } else {
      this.keyControl.addValidators(Validators.required);
    }
    this.keyControl.updateValueAndValidity();
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { name, ...rawConfig } = this.form.getRawValue();
      this.sdk.currentAccount
        .pipe(
          take(1),
          switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, rawConfig.kbid)),
          switchMap((kb) => {
            const serviceTitle = `Agent ${name} key`;
            if (rawConfig.key) {
              return of({ kb, key: rawConfig.key });
            } else if (this.keepExistingKey) {
              return of({ kb, key: this.existingKey });
            } else {
              return this.modalService.openModal(ExpirationModalComponent).onClose.pipe(
                filter((expiration) => !!expiration),
                switchMap(({ expiration }) =>
                  kb.createServiceAccount({ title: serviceTitle, role: 'SMEMBER' }).pipe(
                    switchMap(() => kb.getServiceAccounts()),
                    switchMap((list) => {
                      const sa = list.find((service) => service.title === serviceTitle);
                      const expires = Math.floor(new Date(expiration).getTime() / 1000).toString();
                      return kb.createKey(sa?.id || '', expires).pipe(map((data) => ({ kb, key: data.token })));
                    }),
                  ),
                ),
              );
            }
          }),
        )
        .subscribe({
          next: ({ kb, key }) => {
            const url = kb.fullpath.slice(0, kb.fullpath.indexOf('/api') + 4);
            const config: NucliaDBConfig = {
              ...rawConfig,
              url,
              manager: url,
              key,
            };
            const driver: DriverCreation = {
              name,
              provider: 'nucliadb',
              config,
            };
            this.modal.close(driver);
          },
        });
    }
  }
}
