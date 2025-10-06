import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { SDKService, ZoneService } from '@flaps/core';
import { PaButtonModule, PaTableModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CustomModel, ModelType } from '@nuclia/core';
import {
  BadgeComponent,
  SisProgressModule,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { forkJoin, of, ReplaySubject } from 'rxjs';
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
  selector: 'app-custom-models',
  imports: [
    BadgeComponent,
    CommonModule,
    PaButtonModule,
    PaTableModule,
    PaTogglesModule,
    SisProgressModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
  ],
  templateUrl: './custom-models.component.html',
  styleUrl: './custom-models.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomModelsComponent implements OnInit {
  private sdk = inject(SDKService);
  private zoneService = inject(ZoneService);
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);

  _kbConfigs = new ReplaySubject<{ [id: string]: any }>(1);
  @Input() set kbConfigs(value: { [id: string]: any } | undefined) {
    if (value) {
      this._kbConfigs.next(value);
    }
  }

  kbList = this.sdk.kbList;
  selection: { [kbId: string]: ModelSelection[] } = {};
  hasCustomModels = false;
  isSaving = false;

  customModels = forkJoin([this.sdk.currentAccount.pipe(take(1)), this.zoneService.getZones()]).pipe(
    switchMap(([account, zones]) =>
      forkJoin(
        zones.map((zone) =>
          this.sdk.nuclia.db.getModels(account.id, zone.slug).pipe(
            map((models) => models.filter((model) => model.model_types?.includes(ModelType.GENERATIVE))),
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

  ngOnInit(): void {
    forkJoin([this.kbList.pipe(take(1)), this.customModels, this._kbConfigs.pipe(take(1))]).subscribe(
      ([kbList, customModels, kbConfigs]) => {
        this.selection = kbList.reduce(
          (selection, kb) => {
            selection[kb.id] = customModels[kb.zone].map((model) => ({
              modelId: model.model_id || '',
              title: model.title,
              selected: !!model.kbids?.includes(kb.id),
              default: kbConfigs[kb.id]['generative_model'] === model.location,
            }));
            return selection;
          },
          {} as { [kbId: string]: ModelSelection[] },
        );
        this.hasCustomModels = Object.values(customModels).reduce((acc, modelList) => acc + modelList.length, 0) > 0;
        this.cdr.markForCheck();
      },
    );
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
          this.toaster.error('account.models.custom-models.error');
          this.isSaving = false;
          this.cdr.markForCheck();
        },
      });
  }
}
