import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ValidSlug } from '@flaps/common';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';
import { of, switchMap } from 'rxjs';
import { AccountService } from '../account.service';

const CAMPAIGN_IDS = [
  {
    id: '701Pb00002OJnMNIA1',
    label: 'Agentic RAG trial',
  },
  {
    id: '701Pb00003vMWmsIAG',
    label: 'Context Box trial',
  },
  {
    id: '701Pb00004jQghCIAS',
    label: 'Nuclia Sitefinity trial',
  },
  {
    id: '701Pb00004jP4UJIA0',
    label: 'PDP Studio trial',
  },
];

@Component({
  templateUrl: 'add-account.component.html',
  imports: [PaButtonModule, PaTextFieldModule, PaTogglesModule, ReactiveFormsModule],
})
export class AddAccountComponent {
  private sdk = inject(SDKService);
  private router = inject(Router);
  private toaster = inject(SisToastService);
  private accountService = inject(AccountService);

  isSaving = signal(false);
  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required, ValidSlug()] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    campaign_id: new FormControl(CAMPAIGN_IDS[0].id, { nonNullable: true, validators: [Validators.required] }),
    components: new FormGroup({
      components_radio: new FormControl<'default' | 'custom'>('default', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      availableComponents: new FormGroup({
        rag: new FormControl<boolean>(false, { nonNullable: true }),
        studio: new FormControl<boolean>(false, { nonNullable: true }),
      }),
    }),
  });

  campaignOptions = CAMPAIGN_IDS.map(({ id, label }) => new OptionModel({ id, value: id, label }));

  get components(): FormGroup {
    return this.form.controls.components;
  }

  save() {
    this.isSaving.set(true);
    const { components, ...creationPayload } = this.form.getRawValue();
    const availableComponents: string[] | null =
      components.components_radio === 'custom'
        ? Object.entries(components.availableComponents)
            .filter(([, value]) => value)
            .map(([key]) => key)
        : null;

    this.sdk.nuclia.db
      .createAccount(creationPayload)
      .pipe(
        switchMap((account) =>
          this.components.dirty ? this.accountService.updateAccount(account.id, { availableComponents }) : of(account),
        ),
      )
      .subscribe({
        next: (account) => {
          this.isSaving.set(false);
          this.router.navigate([`/accounts/${account.id}`]);
        },
        error: (error) => {
          this.isSaving.set(false);
          this.toaster.error(JSON.stringify(error));
        },
      });
  }

  cancel() {
    this.router.navigate(['/accounts']);
  }
}
