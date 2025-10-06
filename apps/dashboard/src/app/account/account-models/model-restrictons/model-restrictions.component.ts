import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaTableModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IKnowledgeBoxItem, KnowledgeBox, WritableKnowledgeBox } from '@nuclia/core';
import { SisProgressModule, SisToastService } from '@nuclia/sistema';
import { forkJoin, of } from 'rxjs';
import { map, shareReplay, switchMap, take } from 'rxjs/operators';
import { CustomModelsComponent } from '../custom-models/custom-models.component';

@Component({
  selector: 'app-model-restrictions',
  imports: [
    CommonModule,
    CustomModelsComponent,
    PaButtonModule,
    PaTableModule,
    PaTogglesModule,
    SisProgressModule,
    TranslateModule,
  ],
  templateUrl: './model-restrictions.component.html',
  styleUrl: './model-restrictions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelRestrictionsComponent implements OnInit {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);

  kbList = this.sdk.kbList;
  selection: { [kbId: string]: boolean } = {};
  isLoading = true;
  isSaving = false;

  kbConfigs = forkJoin([this.sdk.currentAccount.pipe(take(1)), this.kbList.pipe(take(1))]).pipe(
    switchMap(([account, kbList]) =>
      kbList.length === 0
        ? of([])
        : forkJoin(
            kbList.map((kb) => {
              this.sdk.nuclia.options.zone = kb.zone;
              return new KnowledgeBox(this.sdk.nuclia, account.id, kb)
                .getConfiguration()
                .pipe(map((config) => [kb.id, config] as [string, any]));
            }),
          ),
    ),
    map((configs) => Object.fromEntries(configs)),
    shareReplay(1),
  );

  ngOnInit(): void {
    this.kbConfigs
      .pipe(
        map((configs) =>
          Object.fromEntries(
            Object.entries(configs).map(([key, value]) => [key, value['allow_all_default_models'] !== false]),
          ),
        ),
      )
      .subscribe((selection) => {
        this.selection = selection;
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  save(kb: IKnowledgeBoxItem, newValue: boolean) {
    this.isSaving = true;
    this.cdr.markForCheck();
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) => {
          this.sdk.nuclia.options.zone = kb.zone;
          const writtableKb = new WritableKnowledgeBox(this.sdk.nuclia, account.id, kb);
          return writtableKb
            .setConfiguration({
              allow_all_default_models: !newValue,
            })
            .pipe(switchMap(() => writtableKb.getConfiguration()));
        }),
      )
      .subscribe({
        next: (config) => {
          this.selection[kb.id] = config['allow_all_default_models'] !== false;
          this.isSaving = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toaster.error('account.models.restrictions.error');
          this.isSaving = false;
          this.cdr.markForCheck();
        },
      });
  }
}
