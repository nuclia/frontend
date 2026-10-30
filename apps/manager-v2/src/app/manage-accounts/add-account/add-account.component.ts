import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ValidSlug } from '@flaps/common';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';

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
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PaButtonModule, PaTextFieldModule, ReactiveFormsModule],
})
export class AddAccountComponent {
  isSaving = false;
  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required, ValidSlug()] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    campaign_id: new FormControl(CAMPAIGN_IDS[0].id, { nonNullable: true, validators: [Validators.required] }),
  });

  campaignOptions = CAMPAIGN_IDS.map(({ id, label }) => new OptionModel({ id, value: id, label }));

  private sdk = inject(SDKService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private toaster = inject(SisToastService);

  save() {
    this.isSaving = true;
    this.cdr.detectChanges();
    this.sdk.nuclia.db.createAccount(this.form.getRawValue()).subscribe({
      next: (account) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.router.navigate([`/accounts/${account.id}`]);
      },
      error: (error) => {
        this.isSaving = false;
        this.cdr.detectChanges();
        this.toaster.error(JSON.stringify(error));
      },
    });
  }

  cancel() {
    this.router.navigate(['/accounts']);
  }
}
