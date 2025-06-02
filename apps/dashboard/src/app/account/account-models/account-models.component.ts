import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { SDKService, ZoneService } from '@flaps/core';
import { PaButtonModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CustomModel, KnowledgeBox, ModelType } from '@nuclia/core';
import {
  BadgeComponent,
  InfoCardComponent,
  SisProgressModule,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';

interface CustomModelWithTitle extends CustomModel {
  title: string;
}

type ModelSelection = {
  modelId: string;
  title: string;
  selected: boolean;
  default: boolean;
};

@Component({
  selector: 'app-account-models',
  imports: [
    BadgeComponent,
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaTogglesModule,
    SisProgressModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
  ],
  templateUrl: './account-models.component.html',
  styleUrl: './account-models.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountModelsComponent implements OnInit, OnDestroy {
  private sdk = inject(SDKService);
  private zoneService = inject(ZoneService);
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);

  unsubscribeAll = new Subject<void>();
  kbList = this.sdk.kbList;
  selection: { [kbId: string]: ModelSelection[] } = {};
  hasModels = false;
  isLoading = true;
  isSaving = false;

  modelsByZone = forkJoin([this.sdk.currentAccount.pipe(take(1)), this.zoneService.getZones()]).pipe(
    switchMap(([account, zones]) =>
      forkJoin(
        zones.map((zone) =>
          this.sdk.nuclia.db.getModels(account.id, zone.slug).pipe(
            map((models) => models.filter((model) => model.model_type === ModelType.GENERATIVE)),
            switchMap((modelItems) =>
              modelItems.length === 0
                ? of([])
                : forkJoin(
                    modelItems.map((modelItem) =>
                      this.sdk.nuclia.db
                        .getModel(modelItem.model_id || '', account.id, zone.slug)
                        .pipe(map((model) => ({ ...model, title: modelItem.title }))),
                    ),
                  ),
            ),
            map((models) => ({ zone, models: models as CustomModelWithTitle[] })),
            catchError(() => of({ zone, models: [] })),
          ),
        ),
      ),
    ),
    map((models) =>
      models.reduce(
        (acc, curr) => {
          acc[curr.zone.slug || ''] = curr.models;
          return acc;
        },
        {} as { [zone: string]: CustomModelWithTitle[] },
      ),
    ),
  );

  defaultModels = forkJoin([this.sdk.currentAccount.pipe(take(1)), this.kbList.pipe(take(1))]).pipe(
    switchMap(([account, kbList]) =>
      kbList.length === 0
        ? of([])
        : forkJoin(
            kbList.map((kb) => {
              this.sdk.nuclia.options.zone = kb.zone;
              return new KnowledgeBox(this.sdk.nuclia, account.id, kb)
                .getConfiguration()
                .pipe(map((config) => ({ id: kb.id, defaultModel: config['generative_model'] })));
            }),
          ),
    ),
    map((defaultModels) =>
      defaultModels.reduce(
        (acc, curr) => {
          acc[curr.id] = curr.defaultModel;
          return acc;
        },
        {} as { [id: string]: string },
      ),
    ),
  );

  ngOnInit(): void {
    forkJoin([this.kbList.pipe(take(1)), this.modelsByZone, this.defaultModels]).subscribe(
      ([kbList, modelsByZone, defaultModels]) => {
        this.selection = kbList.reduce(
          (selection, kb) => {
            selection[kb.id] = modelsByZone[kb.zone].map((model) => ({
              modelId: model.model_id || '',
              title: model.title,
              selected: !!model.kbids?.includes(kb.id),
              default: defaultModels[kb.id] === model.location,
            }));
            return selection;
          },
          {} as { [kbId: string]: ModelSelection[] },
        );
        this.hasModels = Object.values(modelsByZone).reduce((acc, modelList) => acc + modelList.length, 0) > 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    );
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save(modelId: string, kbId: string, zone: string, newValue: boolean) {
    this.isSaving = true;
    this.cdr.markForCheck();
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) =>
          newValue
            ? this.sdk.nuclia.db.addModelToKb(modelId, account.id, kbId, zone)
            : this.sdk.nuclia.db.deleteModelFromKb(modelId, account.id, kbId, zone),
        ),
      )
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toaster.error('account.models.error');
          this.isSaving = false;
          this.cdr.markForCheck();
        },
      });
  }
}
