import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { SDKService, ZoneService } from '@flaps/core';
import {
  ModalConfig,
  PaButtonModule,
  PaTableModule,
  PaTabsModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CustomModel, KnowledgeBox, ModelConfigurationItem, ModelType } from '@nuclia/core';
import {
  BadgeComponent,
  InfoCardComponent,
  SisModalService,
  SisProgressModule,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { forkJoin, of, ReplaySubject, Subject } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { CreateConfigComponent } from './create-config/create-config.component';

interface CustomModelWithTitle extends CustomModel {
  title: string;
}

type ModelSelection = {
  modelId: string;
  title: string;
  selected: boolean;
  default: boolean;
};

interface ModelConfigurationWithZone extends ModelConfigurationItem {
  zone: string;
}

@Component({
  selector: 'app-account-models',
  imports: [
    BadgeComponent,
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaTableModule,
    PaTabsModule,
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
  private modalService = inject(SisModalService);
  private cdr = inject(ChangeDetectorRef);

  unsubscribeAll = new Subject<void>();
  kbList = this.sdk.kbList;
  modelConfigs = new ReplaySubject<ModelConfigurationWithZone[]>(1);
  selectedTab: 'configs' | 'custom-models' = 'configs';
  selection: { [kbId: string]: ModelSelection[] } = {};
  hasCustomModels = false;
  isLoading = true;
  isSaving = false;

  zones = this.zoneService.getZones().pipe(shareReplay(1));

  customModels = forkJoin([this.sdk.currentAccount.pipe(take(1)), this.zones]).pipe(
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
    this.updateModelConfigs().subscribe();

    forkJoin([this.kbList.pipe(take(1)), this.customModels, this.defaultModels]).subscribe(
      ([kbList, customModels, defaultModels]) => {
        this.selection = kbList.reduce(
          (selection, kb) => {
            selection[kb.id] = customModels[kb.zone].map((model) => ({
              modelId: model.model_id || '',
              title: model.title,
              selected: !!model.kbids?.includes(kb.id),
              default: defaultModels[kb.id] === model.location,
            }));
            return selection;
          },
          {} as { [kbId: string]: ModelSelection[] },
        );
        this.hasCustomModels = Object.values(customModels).reduce((acc, modelList) => acc + modelList.length, 0) > 0;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    );
  }

  createConfig() {
    return this.zones
      .pipe(
        switchMap(
          (zones) => this.modalService.openModal(CreateConfigComponent, new ModalConfig({ data: { zones } })).onClose,
        ),
        filter((data) => !!data),
        switchMap((data) =>
          this.sdk.currentAccount.pipe(
            take(1),
            switchMap((account) => {
              const { zone, ...config } = data;
              return this.sdk.nuclia.db.createModelConfiguration(config, account.id, zone);
            }),
          ),
        ),
        switchMap(() => this.updateModelConfigs()),
      )
      .subscribe();
  }

  displayConfig(config: ModelConfigurationWithZone) {
    return forkJoin([
      this.zones,
      this.sdk.currentAccount.pipe(
        take(1),
        switchMap((account) => this.sdk.nuclia.db.getModelConfiguration(config.id, account.id, config.zone)),
      ),
    ]).subscribe(([zones, configDetails]) => {
      this.modalService.openModal(
        CreateConfigComponent,
        new ModalConfig({ data: { zones, config: configDetails, zone: config.zone } }),
      );
    });
  }

  deleteConfig(config: ModelConfigurationWithZone, event?: Event) {
    event?.stopPropagation();
    return this.modalService
      .openConfirm({
        title: 'account.models.model-configs.delete',
        description: 'account.models.model-configs.delete-confirm',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sdk.currentAccount.pipe(take(1))),
        switchMap((account) => this.sdk.nuclia.db.deleteModelConfiguration(config.id, account.id, config.zone)),
        switchMap(() => this.updateModelConfigs()),
      )
      .subscribe();
  }

  updateModelConfigs() {
    return forkJoin([this.sdk.currentAccount.pipe(take(1)), this.zones]).pipe(
      switchMap(([account, zones]) =>
        forkJoin(
          zones.map((zone) =>
            this.sdk.nuclia.db.getModelConfigurations(account.id, zone.slug).pipe(
              map((configs) => ({ zone, configs })),
              catchError(() => of({ zone, configs: [] })),
            ),
          ),
        ),
      ),
      map((configs) =>
        configs.reduce(
          (acc, curr) => acc.concat(curr.configs.map((config) => ({ ...config, zone: curr.zone.slug }))),
          [] as ModelConfigurationWithZone[],
        ),
      ),
      tap((models) => {
        this.modelConfigs.next(models);
      }),
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
          this.toaster.error('account.models.custom-models.error');
          this.isSaving = false;
          this.cdr.markForCheck();
        },
      });
  }
}
