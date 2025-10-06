import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SDKService, ZoneService } from '@flaps/core';
import { ModalConfig, PaButtonModule, PaTableModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ModelConfigurationItem } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { forkJoin, of, ReplaySubject } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { CreateConfigComponent } from './create-config/create-config.component';
import { ModelRestrictionsComponent } from './model-restrictons/model-restrictions.component';

interface ModelConfigurationWithZone extends ModelConfigurationItem {
  zone: string;
}

@Component({
  selector: 'app-account-models',
  imports: [CommonModule, ModelRestrictionsComponent, PaButtonModule, PaTableModule, PaTabsModule, TranslateModule],
  templateUrl: './account-models.component.html',
  styleUrl: './account-models.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountModelsComponent {
  private sdk = inject(SDKService);
  private zoneService = inject(ZoneService);
  private modalService = inject(SisModalService);

  modelConfigs = new ReplaySubject<ModelConfigurationWithZone[]>(1);
  selectedTab: 'configs' | 'restrictions' = 'configs';
  zones = this.zoneService.getZones().pipe(shareReplay(1));

  ngOnInit(): void {
    this.updateModelConfigs().subscribe();
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
}
