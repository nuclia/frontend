import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { map, shareReplay, take } from 'rxjs';
import { ZoneService } from '@flaps/core';
import { ModalRef, OptionModel } from '@guillotinaweb/pastanaga-angular';
import { NuaGuardPolicy } from '../nua-guard.models';
import { NuaGuardService } from '../nua-guard.service';

export interface PolicyDialogData {
  policy?: NuaGuardPolicy;
}

@Component({
  templateUrl: './policy-dialog.component.html',
  styleUrl: './policy-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PolicyDialogComponent implements OnInit {
  modal = inject<ModalRef<PolicyDialogData>>(ModalRef);

  private nuaGuard = inject(NuaGuardService);
  private zoneService = inject(ZoneService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  data = this.modal.config.data?.policy;
  editMode = !!this.data;

  policyForm = new FormGroup({
    name: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true }),
    instruction: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    query: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
    enabled: new FormControl<boolean>(true, { nonNullable: true }),
    blocking: new FormControl<boolean>(true, { nonNullable: true }),
    zone: new FormControl<string>('', { validators: [Validators.required], nonNullable: true }),
  });

  validationMessages = {
    name: { required: 'validation.required' },
    instruction: { required: 'validation.required' },
    query: { required: 'validation.required' },
    zone: { required: 'validation.required' },
  };

  zones = this.zoneService.getZones().pipe(
    take(1),
    map((zones) => zones.map((zone) => new OptionModel({ id: zone.slug, value: zone.slug, label: zone.title || '' }))),
    shareReplay(1),
  );

  private enabledCount = 0;

  /** Enforced client-side only — the issue caps an account at 5 enabled policies and there is no
   *  backend yet to reject a sixth. Editing an already-enabled policy stays unblocked. */
  get enabledLimitReached(): boolean {
    return this.enabledCount >= NuaGuardService.MAX_ENABLED_POLICIES && !this.policyForm.controls.enabled.value;
  }

  ngOnInit() {
    this.nuaGuard.enabledCount$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((count) => {
      this.enabledCount = this.data?.enabled ? count - 1 : count;
      this.cdr.markForCheck();
    });

    // Display/prototype logic:
    // - For existing policies (edit mode), show the assigned region (readonly).
    // - For new policies, region starts empty by default, with multi-select enabled.
    this.zones.pipe(take(1)).subscribe((zones) => {
      if (this.data) {
        const hasZone = zones.some((z) => z.value === this.data?.zone);
        const activeZone = hasZone ? this.data?.zone : (zones[0]?.value || this.data?.zone);
        this.policyForm.patchValue({ ...this.data, zone: activeZone });
      } else {
        this.policyForm.get('zone')?.patchValue('');
      }
      this.cdr.markForCheck();
    });
  }

  save() {
    if (this.policyForm.invalid) return;
    const payload = { ...this.policyForm.getRawValue(), target: 'QUERY' as const };
    const request = this.data
      ? this.nuaGuard.editPolicy(this.data.id, payload)
      : this.nuaGuard.createPolicy(payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.modal.close(true));
  }

  close(): void {
    this.modal.close(false);
  }
}
