import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FeaturesService,
  NavigationService,
  SDKService,
  standaloneSimpleAccount,
  STFUtils,
  ZoneService,
} from '@flaps/core';
import { IErrorMessages, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ExternalIndexProvider, KnowledgeBoxCreation, LearningConfigurations } from '@nuclia/core';
import {
  BackButtonComponent,
  SisModalService,
  SisProgressModule,
  SisToastService,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import {
  EmbeddingsModelFormComponent,
  LearningConfigurationForm,
  VectorDatabaseFormComponent,
  VectorDbModel,
} from '@nuclia/user';
import { filter, forkJoin, map, of, ReplaySubject, Subject, switchMap, take, tap, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-kb-creation',
  imports: [
    CommonModule,
    BackButtonComponent,
    ReactiveFormsModule,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    StickyFooterComponent,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    EmbeddingsModelFormComponent,
    SisProgressModule,
    VectorDatabaseFormComponent,
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
  private cdr = inject(ChangeDetectorRef);
  private navigationService = inject(NavigationService);
  private featureService = inject(FeaturesService);
  private translate = inject(TranslateService);

  private unsubscribeAll = new Subject<void>();

  standalone = this.sdk.nuclia.options.standalone;
  zones = this.standalone
    ? of([])
    : this.zoneService.getZones().pipe(
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

  saving = false;
  semanticModels: string[] = [];
  userKeys?: { [key: string]: any };

  learningSchemasByZone: { [zone: string]: LearningConfigurations } = {};
  learningSchema = new ReplaySubject<LearningConfigurations>(1);

  isExternalIndexEnabled = this.featureService.unstable.externalIndex;
  vectorDbModel: VectorDbModel = {
    external: false,
    type: 'pinecone',
    apiKey: '',
    pinecone: {
      cloud: 'gcp_us_central1',
      awsRegion: 'aws_us_east_1',
    },
  };
  externalIndexProvider: ExternalIndexProvider | null = null;

  ngOnInit() {
    if (this.sdk.nuclia.options.standalone) {
      this.sdk.nuclia.db.getLearningSchema().subscribe({
        next: (schema) => {
          this.learningSchema.next(schema);
        },
        error: (error) => {
          this.toaster.error(
            this.translate.instant('kb.create.error-loading-schema', { error: error.body.detail || 'Unknown error' }),
          );
        },
      });
    } else {
      // update learning schema when zone changes
      this.form.controls.zone.valueChanges
        .pipe(
          switchMap((zone) =>
            this.learningSchemasByZone[zone]
              ? of(this.learningSchemasByZone[zone])
              : this.getLearningSchemaForZone(zone),
          ),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe((schema) => {
          this.learningSchema.next(schema);
        });
    }
  }

  private getLearningSchemaForZone(zone: string) {
    return this.account.pipe(
      filter((account) => !!account),
      take(1),
      switchMap((account) => {
        return this.sdk.nuclia.db
          .getLearningSchema(account.id, zone)
          .pipe(tap((schema) => (this.learningSchemasByZone[zone] = schema)));
      }),
    );
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  create() {
    if (this.semanticModels.length < 1) {
      return;
    }
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
        switchMap(() => forkJoin([this.account.pipe(take(1)), this.isExternalIndexEnabled.pipe(take(1))])),
        switchMap(([account, isExternalIndexEnabled]) => {
          let user_keys;
          if (this.userKeys) {
            user_keys = this.userKeys;
          }
          const kb: KnowledgeBoxCreation = {
            ...kbConfig,
            slug: STFUtils.generateSlug(kbConfig.title),
            learning_configuration: {
              anonymization_model: anonymization ? 'multilingual' : 'disabled',
              semantic_models: this.semanticModels,
              user_keys,
            },
          };
          if (isExternalIndexEnabled && this.externalIndexProvider) {
            kb.external_index_provider = this.externalIndexProvider;
          }
          return this.sdk.nuclia.db.createKnowledgeBox(account.id, kb, kb.zone).pipe(
            catchError((error) => {
              if (error.status === 409) {
                kb.slug = `${kb.slug}-${STFUtils.generateRandomSlugSuffix()}`;
                return this.sdk.nuclia.db.createKnowledgeBox(account.id, kb, kb.zone);
              } else {
                return throwError(() => error);
              }
            }),
          );
        }),
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
          this.form.enable();
          this.saving = false;
        },
      });
  }

  updateModel(learningConfig: LearningConfigurationForm) {
    this.semanticModels = learningConfig.semantic_models;
    this.userKeys = learningConfig.user_keys;
  }

  cancel() {
    this.router.navigate([this.backPath], { relativeTo: this.route });
  }

  updatePineconeCloud(zone: string) {
    if (zone.startsWith('europe')) {
      this.vectorDbModel = {
        ...this.vectorDbModel,
        pinecone: {
          ...this.vectorDbModel.pinecone,
          cloud: 'gcp_us_central1',
        },
      };
    } else if (zone.startsWith('aws')) {
      this.vectorDbModel = {
        ...this.vectorDbModel,
        pinecone: {
          ...this.vectorDbModel.pinecone,
          cloud: 'aws',
          awsRegion: 'aws_us_east_1',
        },
      };
    }
  }
}
