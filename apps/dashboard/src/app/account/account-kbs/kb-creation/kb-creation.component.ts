import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getSemanticModel, SDKService, STFUtils, ZoneService } from '@flaps/core';
import {
  BackButtonComponent,
  SisModalService,
  SisToastService,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IErrorMessages, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { filter, of, switchMap, tap, throwError } from 'rxjs';
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
  ],
  templateUrl: './kb-creation.component.html',
  styleUrl: './kb-creation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbCreationComponent implements OnInit, OnDestroy {
  private sdk = inject(SDKService);
  private zoneService: ZoneService = inject(ZoneService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  zones = this.zoneService.getZones().pipe(
    tap((zones) => {
      if (zones && zones.length > 0) {
        this.form.patchValue({ zone: zones[0].slug });
      }
    }),
  );
  account = this.sdk.currentAccount;

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

  ngOnInit() {}
  ngOnDestroy() {}

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
        switchMap(() => this.account),
        switchMap((account) =>
          this.sdk.nuclia.db.getLearningSchema(account.id, kbConfig.zone).pipe(
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
      )
      .subscribe({
        next: () => {
          this.sdk.refreshKbList();
          this.router.navigate(['..'], { relativeTo: this.route });
        },
        error: () => {
          this.toaster.error('stash.create.failure');
        },
      });
  }

  updateModel(semanticModel: string) {
    this.semanticModel = semanticModel;
  }
}
