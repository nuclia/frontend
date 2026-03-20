import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  BedrockService,
  BedrockStatus,
  BEDROCK_IAM_POLICY,
  FeaturesService,
  SDKService,
  Zone,
  ZoneService,
} from '@flaps/core';
import {
  ModalConfig,
  PaButtonModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTabsModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ModelConfigurationItem } from '@nuclia/core';
import {
  SisModalService,
  SisProgressModule,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { forkJoin, of, ReplaySubject } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { CreateConfigComponent } from './create-config/create-config.component';
import { ModelRestrictionsComponent } from './model-restrictons/model-restrictions.component';
import { AssumeRoleModalComponent } from '../assume-role-modal/assume-role-modal.component';

interface ModelConfigurationWithZone extends ModelConfigurationItem {
  zone: string;
}

interface BedrockIntegration extends BedrockStatus {
  zone: Zone;
}

@Component({
  selector: 'app-account-models',
  imports: [
    CommonModule,
    ModelRestrictionsComponent,
    PaButtonModule,
    PaIconModule,
    PaPopupModule,
    PaTableModule,
    PaTabsModule,
    PaTooltipModule,
    SisProgressModule,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
  ],
  templateUrl: './account-models.component.html',
  styleUrl: './account-models.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountModelsComponent {
  private sdk = inject(SDKService);
  private zoneService = inject(ZoneService);
  private modalService = inject(SisModalService);
  private bedrockService = inject(BedrockService);
  private features = inject(FeaturesService);
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);

  modelConfigs = new ReplaySubject<ModelConfigurationWithZone[]>(1);
  selectedTab: 'settings' | 'restrictions' = 'settings';
  zones = this.zoneService.getZones().pipe(shareReplay(1));

  awsZones = this.zones.pipe(
    map((zones) =>
      zones
        .filter((zone) => zone.cloud_provider === 'AWS')
        .sort((a, b) => (a.title || '').localeCompare(b.title || '')),
    ),
  );
  bedrockIntegrations = new ReplaySubject<BedrockIntegration[]>(1);
  bedrockZones = this.bedrockIntegrations.pipe(
    map((items) => items.filter((item) => item.status === 'active').map((item) => item.zone)),
  );
  isBedrockIntegrationEnabled = this.features.unstable.bedrockIntegration;
  loadingBedrock = false;

  ngOnInit(): void {
    this.updateModelConfigs().subscribe();
    this.updateBedrockIntegrations().subscribe();
  }

  createConfig() {
    return forkJoin([this.zones.pipe(take(1)), this.bedrockZones.pipe(take(1))])
      .pipe(
        switchMap(
          ([zones, bedrockZones]) =>
            this.modalService.openModal(CreateConfigComponent, new ModalConfig({ data: { zones, bedrockZones } }))
              .onClose,
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
      this.bedrockZones.pipe(take(1)),
      this.sdk.currentAccount.pipe(
        take(1),
        switchMap((account) => this.sdk.nuclia.db.getModelConfiguration(config.id, account.id, config.zone)),
      ),
    ])
      .pipe(
        switchMap(
          ([zones, bedrockZones, configDetails]) =>
            this.modalService.openModal(
              CreateConfigComponent,
              new ModalConfig({ data: { zones, bedrockZones, config: configDetails, zone: config.zone } }),
            ).onClose,
        ),
        filter((data) => !!data),
        switchMap((data) =>
          this.sdk.currentAccount.pipe(
            take(1),
            switchMap((account) => {
              const { zone, ...rest } = data;
              return this.sdk.nuclia.db.updateModelConfiguration(rest, config.id, account.id, zone);
            }),
          ),
        ),
        switchMap(() => this.updateModelConfigs()),
      )
      .subscribe();
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

  setupIntegration(zone: string) {
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) => this.bedrockService.startAuthFlow(account.id, zone)),
        switchMap(
          (params) =>
            this.modalService.openModal(
              AssumeRoleModalComponent,
              new ModalConfig({
                dismissable: false,
                data: {
                  params,
                  policy: BEDROCK_IAM_POLICY,
                  policyHelp: 'account.models.bedrock.policy',
                  title: 'account.models.bedrock.integration',
                  isBedrock: true,
                },
              }),
            ).onClose,
        ),
        switchMap((arn) => (arn ? this.createIntegration(zone, arn) : this._deleteIntegration(zone))),
        switchMap(() => this.updateBedrockIntegrations()),
      )
      .subscribe();
  }

  createIntegration(zone: string, arn: string) {
    return this.sdk.currentAccount.pipe(
      take(1),
      tap(() => {
        this.loadingBedrock = true;
        this.cdr.markForCheck();
      }),
      switchMap((account) =>
        this.bedrockService
          .finishAuthFlow(account.id, zone, { role_arn: arn })
          .pipe(switchMap(() => this.bedrockService.getStatus(account.id, zone))),
      ),
      tap((res) => {
        this.loadingBedrock = false;
        this.cdr.markForCheck();
        if (res.status !== 'active') {
          this.toaster.error('account.models.bedrock.error');
        }
      }),
      catchError(() => {
        this.loadingBedrock = false;
        this.cdr.markForCheck();
        this.toaster.error('account.models.bedrock.error');
        return of(true);
      }),
    );
  }

  deleteIntegration(zone: string) {
    return this.modalService
      .openConfirm({
        title: 'account.models.bedrock.delete-confirm.title',
        description: 'account.models.bedrock.delete-confirm.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this._deleteIntegration(zone)),
        switchMap(() => this.updateBedrockIntegrations()),
      )
      .subscribe();
  }

  private _deleteIntegration(zone: string) {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.bedrockService.delete(account.id, zone)),
    );
  }

  updateBedrockIntegrations() {
    this.loadingBedrock = true;
    this.cdr.markForCheck();
    return forkJoin([this.sdk.currentAccount.pipe(take(1)), this.awsZones]).pipe(
      switchMap(([account, zones]) =>
        zones.length === 0
          ? of([])
          : forkJoin(
              zones.map((zone) =>
                this.bedrockService.getStatus(account.id, zone.slug).pipe(map((status) => ({ ...status, zone: zone }))),
              ),
            ),
      ),
      tap((items) => {
        this.bedrockIntegrations.next(items);
        this.loadingBedrock = false;
        this.cdr.markForCheck();
      }),
    );
  }
}
