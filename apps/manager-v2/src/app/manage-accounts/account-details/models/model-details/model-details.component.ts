import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, filter, forkJoin, map, of, shareReplay, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ManagerStore } from '../../../../manager.store';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { RegionalAccountService } from '../../../regional-account.service';
import { AccountModel } from '../../../regional-account.models';
import { ActivatedRoute } from '@angular/router';
import { SisToastService } from '@nuclia/sistema';

@Component({
  imports: [CommonModule, PaButtonModule, PaTogglesModule, ReactiveFormsModule],
  templateUrl: './model-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelDetailsComponent implements OnDestroy, OnInit {
  private unsubscribeAll = new Subject<void>();

  kbForm = new FormGroup<{ [key: string]: FormControl<boolean> }>({});
  isSaving = false;
  backupModel?: AccountModel;
  zone?: string;
  modelNames = this.store.kbList.pipe(
    map((kbs) => kbs.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.title }), {} as { [id: string]: string })),
    shareReplay(1),
  );

  constructor(
    private store: ManagerStore,
    private regionalService: RegionalAccountService,
    private route: ActivatedRoute,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    combineLatest([
      this.store.accountDetails.pipe(filter((accountDetails) => !!accountDetails)),
      this.route.params.pipe(map((params) => params['modelId'])),
      this.route.params.pipe(map((params) => params['zoneSlug'])),
      this.store.kbList,
    ])
      .pipe(
        takeUntil(this.unsubscribeAll),
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
        switchMap(([account, modelId, zoneSlug]) => this.regionalService.getModel(modelId, account.id, zoneSlug)),
      )
      .subscribe((model) => {
        if (model) {
          this.initForm(model);
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  initForm(model: AccountModel) {
    this.backupModel = model;
    this.kbForm.reset();
    model.kbids.forEach((id) => {
      this.kbForm.controls[id]?.patchValue(true);
    });
    this.kbForm.markAsPristine();
    this.cdr.markForCheck();
  }

  save() {
    this.isSaving = true;
    this.cdr.markForCheck();
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
      ...toAdd.map((kbId) => this.regionalService.addModelToKb(modelId, accountId, kbId, this.zone || '')),
      ...toDelete.map((kbId) => this.regionalService.deleteModelFromKb(modelId, accountId, kbId, this.zone || '')),
    ];
    (requests.length > 0 ? forkJoin(requests) : of([]))
      .pipe(switchMap(() => this.regionalService.getModel(modelId, accountId, zone)))
      .subscribe({
        next: (model) => {
          this.initForm(model);
          this.isSaving = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toast.error('Modifying the model failed');
          this.isSaving = false;
          this.cdr.markForCheck();
        },
      });
  }

  cancel() {
    if (this.backupModel) {
      this.initForm(this.backupModel);
    }
  }
}
