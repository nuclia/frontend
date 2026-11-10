import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, filter, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ManagerStore } from '../../../../manager.store';
import { KeyValuePipe } from '@angular/common';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmCheckboxImports } from '@nuclia/ui-spartan/checkbox';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { ActivatedRoute } from '@angular/router';
import { toast } from '@spartan-ng/brain/sonner';
import { CustomModel } from '@nuclia/core';
import { SDKService } from '@flaps/core';

@Component({
  imports: [KeyValuePipe, ReactiveFormsModule, HlmButtonImports, HlmCheckboxImports, HlmFieldImports],
  templateUrl: './model-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelDetailsComponent {
  private store = inject(ManagerStore);
  private sdk = inject(SDKService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  kbForm = new FormGroup<{ [key: string]: FormControl<boolean> }>({});
  isSaving = signal(false);
  backupModel?: CustomModel;
  zone?: string;
  modelNames = computed(() =>
    this.store.kbList().reduce((acc, curr) => ({ ...acc, [curr.id]: curr.title }), {} as { [id: string]: string }),
  );
  private accountDetails$ = toObservable(this.store.accountDetails);
  private kbList$ = toObservable(this.store.kbList);

  constructor() {
    combineLatest([
      this.accountDetails$.pipe(filter((accountDetails) => !!accountDetails)),
      this.route.params.pipe(map((params) => params['modelId'])),
      this.route.params.pipe(map((params) => params['zoneSlug'])),
      this.kbList$,
    ])
      .pipe(
        takeUntilDestroyed(),
        tap(([, , zoneSlug, kbList]) => {
          this.zone = zoneSlug;
          this.kbForm = new FormGroup(
            kbList
              .filter((kb) => kb.zone.slug === zoneSlug)
              .reduce(
                (controls, kb) => {
                  controls[kb.id] = new FormControl<boolean>(false, { nonNullable: true });
                  return controls;
                },
                {} as { [key: string]: FormControl<boolean> },
              ),
          );
        }),
        switchMap(([account, modelId, zoneSlug]) => this.sdk.nuclia.db.getModel(modelId, account.id, zoneSlug)),
      )
      .subscribe((model) => {
        if (model) {
          this.initForm(model);
        }
      });
  }

  initForm(model: CustomModel) {
    this.backupModel = model;
    this.kbForm.reset();
    model.kbids.forEach((id) => {
      this.kbForm.controls[id]?.patchValue(true);
    });
    this.kbForm.markAsPristine();
    this.cdr.markForCheck();
  }

  save() {
    this.isSaving.set(true);
    const accountId = this.store.getAccountId() || '';
    const zone = this.zone || '';
    const modelId = this.backupModel?.model_id || '';
    const kbIds = this.backupModel?.kbids || [];
    const toAdd = Object.entries(this.kbForm.value)
      .filter(([kbId, enabled]) => !kbIds.includes(kbId) && enabled)
      .map(([kbId]) => kbId);
    const toDelete = Object.entries(this.kbForm.value)
      .filter(([kbId, enabled]) => kbIds.includes(kbId) && !enabled)
      .map(([kbId]) => kbId);
    const requests = [
      ...toAdd.map((kbId) => this.sdk.nuclia.db.addModelToKb(modelId, accountId, kbId, zone)),
      ...toDelete.map((kbId) => this.sdk.nuclia.db.deleteModelFromKb(modelId, accountId, kbId, zone)),
    ];
    (requests.length > 0 ? forkJoin(requests) : of([]))
      .pipe(switchMap(() => this.sdk.nuclia.db.getModel(modelId, accountId, zone)))
      .subscribe({
        next: (model) => {
          this.initForm(model);
          this.isSaving.set(false);
        },
        error: () => {
          toast.error('Modifying the model failed');
          this.isSaving.set(false);
        },
      });
  }

  cancel() {
    if (this.backupModel) {
      this.initForm(this.backupModel);
    }
  }
}
