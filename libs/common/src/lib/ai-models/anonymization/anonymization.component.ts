import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { StickyFooterComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { filter, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { Zone } from '@flaps/core';

interface Project {
  account_id: string;
  project_id: string;
  name: string;
  description?: string;
  created_datetime: string;
  updated_datetime: string;
}

interface ZoneSummary {
  id: string;
  slug: string;
  account: string | null;
  title: string;
  created: string;
  modified: string | null;
  '@id': string;
  cloud_provider: 'AWS' | 'GCP';
  private: boolean;
  origin: string | null;
}

interface Projects {
  data: Project[];
  total: number;
}

interface ProjectDetails extends Project {
  zone: Zone;
}

@Component({
  selector: 'stf-anonymization',
  imports: [
    FormsModule,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    ReactiveFormsModule,
    PaTogglesModule,
    StickyFooterComponent,
    PaButtonModule,
  ],
  templateUrl: './anonymization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymizationComponent extends LearningConfigurationDirective {
  configForm = new FormGroup({
    anonymization: new FormControl<boolean>(false, { nonNullable: true }),
  });

  get anonymizationBackup() {
    return this.kbConfigBackup?.['anonymization_model'] === 'multilingual';
  }

  get anonymizationControl() {
    return this.configForm.controls.anonymization;
  }

  get anonymizationEnabled() {
    return this.configForm.controls.anonymization.value;
  }

  protected resetForm(): void {
    const kbConfig = this.kbConfigBackup;
    if (kbConfig) {
      this.anonymizationControl.patchValue(kbConfig['anonymization_model'] === 'multilingual');
      setTimeout(() => {
        this.configForm.markAsPristine();
        this.cdr.markForCheck();
      });
    }
  }

  constructor() {
    super();
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) => this.getProjects(account.id)),
      )
      .subscribe((projects) => {
        console.log('Projects fetched:');
        console.log(projects);
      });
  }

  getZoneDict(): Observable<{ [zoneId: string]: Zone }> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => {
        return this.sdk.nuclia.rest.get<Zone[]>(`/zones`).pipe(
          map((zones) =>
            zones.reduce(
              (map, zone) => {
                map[zone.id] = zone;
                return map;
              },
              {} as { [zoneId: string]: Zone },
            ),
          ),
        );
      }),
    );
  }

  getProjects(accountId: string): Observable<ProjectDetails[]> {
    return this.getZoneDict().pipe(
      take(1),
      switchMap((zones) =>
        forkJoin(
          Object.values(zones).map((zone) =>
            this.sdk.nuclia.rest
              .get<Projects>(`/dataplatform/${accountId}/projects`, undefined, undefined, zone.slug)
              .pipe(
                map((projects) => projects.data.map((project) => ({ ...project, zone }))),
                catchError(() => of([])),
              ),
          ),
        ),
      ),
      map((projects) => projects.flat()),
    );
  }

  protected save() {
    if (!this.kb) {
      return;
    }

    this.saving = true;
    const kbBackup = this.kb;
    const kbConfig: { [key: string]: any } = {
      anonymization_model: this.anonymizationEnabled ? 'multilingual' : 'disabled',
    };

    const confirmAnonymization: Observable<boolean> =
      this.anonymizationEnabled && this.kbConfigBackup?.['anonymization_model'] === 'disabled'
        ? this.modal.openConfirm({
            title: this.translate.instant('kb.ai-models.anonymization.confirm-anonymization.title'),
            description: this.translate.instant('kb.ai-models.anonymization.confirm-anonymization.description'),
            confirmLabel: this.translate.instant('kb.ai-models.anonymization.confirm-anonymization.confirm-button'),
          }).onClose
        : of(true);
    confirmAnonymization
      .pipe(
        tap((confirm) => {
          if (!confirm) {
            this.saving = false;
            this.resetForm();
          }
        }),
        filter((confirm) => confirm),
        switchMap(() =>
          kbBackup.setConfiguration(kbConfig).pipe(
            tap(() => this.toaster.success(this.translate.instant('kb.ai-models.toasts.success'))),
            catchError(() => {
              this.toaster.error(this.translate.instant('kb.ai-models.toasts.failure'));
              return of(undefined);
            }),
          ),
        ),
        switchMap(() =>
          this.sdk.currentAccount.pipe(
            switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, kbBackup.id, kbBackup.zone)),
          ),
        ),
      )
      .subscribe(() => {
        this.configForm.markAsPristine();
        this.saving = false;
        this.sdk.refreshKbList(true);
      });
  }
}
