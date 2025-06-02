import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { SisToastService } from '@nuclia/sistema';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, forkJoin, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ManagerStore } from '../../../../manager.store';
import { CommonModule } from '@angular/common';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { RegionalAccountService } from '../../../regional-account.service';
import { ZoneService } from '../../../../manage-zones/zone.service';
import { ModelType } from '@nuclia/core';
import { Router } from '@angular/router';
import { KbSummary } from '../../../account-ui.models';
import { SDKService } from '@flaps/core';

@Component({
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, PaTogglesModule, ReactiveFormsModule],
  templateUrl: './add-model.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddModelComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();

  modelForm = new FormGroup({
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    model_type: new FormControl<ModelType>(ModelType.GENERATIVE, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    location: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[^:\s]+:[^:\s]+$/)],
    }),
    zone: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  modelTypes = Object.values(ModelType).map((value) => new OptionModel({ id: value, value, label: value }));
  zones = this.zoneService.getZoneDict().pipe(
    map((zones) =>
      Object.values(zones).map((zone) => new OptionModel({ id: zone.slug, value: zone.slug, label: zone.title })),
    ),
    tap((options) => {
      if (!this.zoneControl.value) this.zoneControl.patchValue(options[0].value);
    }),
  );
  isSaving = false;
  kbList: KbSummary[] = [];
  selectedKbs: { [id: string]: boolean } = {};

  get zoneControl() {
    return this.modelForm.controls.zone;
  }

  constructor(
    private store: ManagerStore,
    private regionalService: RegionalAccountService,
    private sdk: SDKService,
    private zoneService: ZoneService,
    private toast: SisToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    combineLatest([this.store.kbList, this.zoneControl.valueChanges])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([kbList, zone]) => {
        this.selectedKbs = {};
        this.kbList = kbList.filter((kb) => kb.zone.slug === zone);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  create() {
    this.isSaving = true;
    this.cdr.markForCheck();
    const { zone, ...formValues } = this.modelForm.getRawValue();
    const accountId = this.store.getAccountId();
    if (accountId) {
      this.regionalService.createModel(formValues, accountId, zone)
        .pipe(
          switchMap(({ id }) => {
            const requests = Object.entries(this.selectedKbs)
              .filter(([, enabled]) => enabled)
              .map(([kbId]) => this.sdk.nuclia.db.addModelToKb(id, accountId, kbId, zone));
            return requests.length > 0 ? forkJoin(requests) : of([]);
          }),
        )
        .subscribe({
          next: () => {
            this.router.navigate([`/accounts/${accountId}/models`]);
          },
          error: () => {
            this.toast.error('Adding model failed');
            this.isSaving = false;
            this.cdr.markForCheck();
          },
        });
    }
  }
}
