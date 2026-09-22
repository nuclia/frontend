import { ChangeDetectorRef, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZoneService } from '@flaps/core';
import {
  ModalRef,
  OptionModel,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NuaGuardPolicy } from '@nuclia/core';
import { map, take } from 'rxjs';
import { NuaGuardService } from '../nua-guard.service';

@Component({
  selector: 'app-policy-dialog',
  imports: [PaButtonModule, PaModalModule, PaTextFieldModule, PaTogglesModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './policy-dialog.component.html',
  styleUrl: './policy-dialog.component.scss',
})
export class PolicyDialogComponent implements OnInit {
  modal = inject<ModalRef<NuaGuardPolicy>>(ModalRef);

  private nuaGuardservice = inject(NuaGuardService);
  private zoneService = inject(ZoneService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  data = signal<NuaGuardPolicy | undefined>(undefined);
  editMode = computed(() => !!this.data());

  policyForm = new FormGroup({
    name: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(200)],
      nonNullable: true,
    }),
    description: new FormControl<string>('', { validators: [Validators.maxLength(2000)], nonNullable: true }),
    instruction: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(20000)],
      nonNullable: true,
    }),
    query: new FormControl<string>('', {
      validators: [Validators.required, Validators.maxLength(1000)],
      nonNullable: true,
    }),
    enabled: new FormControl<boolean>(false, { nonNullable: true }),
    blocking: new FormControl<boolean>(true, { nonNullable: true }),
    zone: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
  });
  validationMessages = {
    name: { required: 'validation.required', maxlength: 'account.nua-guard.field.name-maxlength' },
    instruction: { required: 'validation.required', maxlength: 'account.nua-guard.field.instruction-maxlength' },
    query: { required: 'validation.required', maxlength: 'account.nua-guard.field.query-maxlength' },
    zone: { required: 'validation.required' },
    description: { maxlength: 'account.nua-guard.field.description-maxlength' },
  };

  zoneOptions = signal<OptionModel[]>([]);

  ngOnInit(): void {
    this.data.set(this.modal.config.data);

    this.zoneService
      .getZones()
      .pipe(
        take(1),
        map((zones) =>
          zones.map((zone) => new OptionModel({ id: zone.slug, value: zone.slug, label: zone.title || '' })),
        ),
      )
      .subscribe((zoneOptions) => {
        this.zoneOptions.set(zoneOptions);

        const data = this.data();
        if (data) {
          const hasZone = zoneOptions.some((z) => z.value === data.zone);
          const activeZone = hasZone ? data.zone : zoneOptions[0]?.value || data.zone;
          this.policyForm.patchValue({ ...data, zone: activeZone });
          this.policyForm.get('zone')?.disable();
        } else {
          this.policyForm.get('zone')?.patchValue('');
          this.policyForm.get('zone')?.enable();
        }
        this.cdr.markForCheck();
      });
  }

  save() {
    if (this.policyForm.invalid) return;
    const { zone, ...payload } = { ...this.policyForm.getRawValue(), target: 'QUERY' as const };
    const policyId = this.data()?.id;
    const request = policyId
      ? this.nuaGuardservice.editPolicy(policyId, zone, payload)
      : this.nuaGuardservice.createPolicy(zone, payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.modal.close(true));
  }

  close(): void {
    this.modal.close(false);
  }
}
