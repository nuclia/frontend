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
import { ExpandableTextareaComponent, InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { filter, map, of, switchMap, take } from 'rxjs';
import { ExpirationModalComponent } from '../../../token-dialog/expiration-modal.component';
import { getListFromTextarea } from '../../arag.utils';

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
    ExpandableTextareaComponent,
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
    key: new FormControl<string>('', { nonNullable: true }),
    filters: new FormControl<string>('', { nonNullable: true }),
    keepExistingKey: new FormControl<boolean>(false, { nonNullable: true }),
    custom: new FormControl<boolean>(false, { nonNullable: true }),
    url: new FormControl<string>('https://europe-1.nuclia.cloud/api', { nonNullable: true }),
    manager: new FormControl<string>('https://europe-1.nuclia.cloud/api', { nonNullable: true }),
  });

  isEdit: boolean;

  get keyControl() {
    return this.form.controls.key;
  }
  get keepExistingKey() {
    return this.form.controls.keepExistingKey.getRawValue();
  }
  get customConfig() {
    return this.form.controls.custom.getRawValue();
  }
  get config() {
    return this.modal.config.data?.driver;
  }
  get kbList() {
    return this.modal.config.data?.kbList || [];
  }
  get kb() {
    return this.getKb(this.form.controls.kbid.getRawValue());
  }

  private existingKey?: string;

  private getKb(kbId: string): IKnowledgeBoxItem | undefined {
    return this.kbList.find((kb) => kb.id === kbId);
  }

  constructor(public modal: ModalRef<{ driver: NucliaDBDriver; kbList: IKnowledgeBoxItem[] }>) {
    const data = this.modal.config.data;
    const driver = data?.driver;
    this.isEdit = !!driver;
    if (driver) {
      const kbid = driver.config.kbid;
      const custom = !this.getKb(kbid);
      this.existingKey = driver.config.key;
      this.form.patchValue({
        name: driver.name,
        kbid,
        description: driver.config.description,
        keepExistingKey: true,
        custom,
        key: custom ? driver.config.key : undefined,
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
      const { name, filters, custom, keepExistingKey, ...rawConfig } = this.form.getRawValue();
      const filterList = getListFromTextarea(filters || '');
      if (custom) {
        const config: NucliaDBConfig = {
          ...rawConfig,
          filters: filterList,
        };
        this.submitConfig(name, config);
      } else {
        this.sdk.currentAccount
          .pipe(
            take(1),
            switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, rawConfig.kbid)),
            switchMap((kb) => {
              const serviceTitle = `Agent ${name} key`;
              if (rawConfig.key) {
                return of({ kb, key: rawConfig.key });
              } else if (keepExistingKey) {
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
                filters: filterList,
              };
              this.submitConfig(name, config);
            },
          });
      }
    }
  }

  private submitConfig(name: string, config: NucliaDBConfig) {
    const driver: Omit<DriverCreation, 'identifier'> = {
      name,
      provider: 'nucliadb',
      config,
    };
    this.modal.close(driver);
  }
}
