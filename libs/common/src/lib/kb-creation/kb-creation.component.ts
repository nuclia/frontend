import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  getSemanticModel,
  NavigationService,
  SDKService,
  standaloneSimpleAccount,
  STFUtils,
  ZoneService,
} from '@flaps/core';
import {
  BackButtonComponent,
  SisModalService,
  SisProgressModule,
  SisToastService,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IErrorMessages, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { filter, map, of, switchMap, take, tap, throwError } from 'rxjs';
import { LanguageFieldComponent } from '@nuclia/user';
import { catchError } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-kb-creation',
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    StickyFooterComponent,
    PaButtonModule,
    PaTogglesModule,
    LanguageFieldComponent,
    SisProgressModule,
  ],
  templateUrl: './kb-creation.component.html',
  styleUrl: './kb-creation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbCreationComponent {
  private sdk = inject(SDKService);
  private zoneService: ZoneService = inject(ZoneService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private navigationService = inject(NavigationService);

  zones = this.zoneService.getZones().pipe(
    tap((zones) => {
      if (zones && zones.length > 0) {
        this.form.patchValue({ zone: zones[0].slug });
      }
    }),
  );
  account = this.sdk.currentAccount;
  backPath = this.sdk.nuclia.options.standalone ? `/select/${standaloneSimpleAccount.slug}` : '..';

  form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    zone: new FormControl<string>('', {
      nonNullable: true,
      validators: this.sdk.nuclia.options.standalone ? [] : [Validators.required],
    }),
    anonymization: new FormControl<boolean>(false, { nonNullable: true }),
  });
  validationMessages: { [key: string]: IErrorMessages } = {
    title: {
      required: 'validation.required',
    },
  };

  semanticModel = '';
  saving = false;

  create() {
    const { anonymization, ...kbConfig } = this.form.getRawValue();

    const confirmed = anonymization
      ? this.modalService
          .openConfirm({
            title: 'account.kb.creation-form.anonymization.confirm.title',
            description: 'account.kb.creation-form.anonymization.confirm.description',
            confirmLabel: 'account.kb.creation-form.anonymization.confirm.confirm-button',
          })
          .onClose.pipe(filter((confirmed) => !!confirmed))
      : of(true);
    confirmed
      .pipe(
        tap(() => {
          this.form.disable();
          this.saving = true;
          this.cdr.markForCheck();
        }),
        switchMap(() => this.account.pipe(take(1))),
        switchMap((account) =>
          (this.sdk.nuclia.options.standalone
            ? this.sdk.nuclia.db.getLearningSchema()
            : this.sdk.nuclia.db.getLearningSchema(account.id, kbConfig.zone)
          ).pipe(
            switchMap((learningConfiguration) => {
              const kb = {
                ...kbConfig,
                slug: STFUtils.generateSlug(kbConfig.title),
                learning_configuration: {
                  anonymization_model: anonymization ? 'multilingual' : 'disabled',
                  semantic_model: getSemanticModel(this.semanticModel, learningConfiguration),
                },
              };
              return this.sdk.nuclia.db.createKnowledgeBox(account.id, kb, kb.zone).pipe(
                catchError((error) => {
                  if (error.status === 409) {
                    kb.slug = `${kb.slug}-${(Math.floor(Math.random() * 10000) + 4096).toString(16)}`;
                    return this.sdk.nuclia.db.createKnowledgeBox(account.id, kb, kb.zone);
                  } else {
                    return throwError(() => error);
                  }
                }),
              );
            }),
          ),
        ),
        map((kb) =>
          this.sdk.nuclia.options.standalone
            ? this.navigationService.getKbUrl(standaloneSimpleAccount.slug, kb.id)
            : this.backPath,
        ),
      )
      .subscribe({
        next: (nextPath) => {
          this.sdk.refreshKbList();
          this.router.navigate([nextPath], { relativeTo: this.route });
        },
        error: () => {
          this.toaster.error('kb.create.error');
        },
      });
  }

  updateModel(semanticModel: string) {
    this.semanticModel = semanticModel;
  }
}
