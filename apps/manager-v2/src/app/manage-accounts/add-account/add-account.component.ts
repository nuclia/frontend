import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ValidSlug } from '@flaps/common';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';

@Component({
  templateUrl: 'add-account.component.html',
  standalone: true,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, ReactiveFormsModule],
})
export class AddAccountComponent {
  isSaving = false;
  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required, ValidSlug()] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
  });
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
