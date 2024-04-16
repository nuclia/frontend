import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent, StickyFooterComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaButtonModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { filter, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'stf-anonymization',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    ReactiveFormsModule,
    InfoCardComponent,
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
