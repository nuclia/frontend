import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SDKService, STFUtils } from '@flaps/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { WritableKnowledgeBox } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { filter, merge, Observable, of, Subject } from 'rxjs';
import { catchError, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { StandaloneService } from '../services';
import { Sluggable } from '../validators';

@Component({
  templateUrl: './knowledge-box-settings.component.html',
  styleUrls: ['./knowledge-box-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KnowledgeBoxSettingsComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();

  kb?: WritableKnowledgeBox;
  kbForm = new FormGroup({
    uid: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    zone: new FormControl<string>('', { nonNullable: true }),
    slug: new FormControl<string>('', { nonNullable: true, validators: [Sluggable(true)] }),
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
    allowed_origins: new FormControl<string | null>(null),
    hidden_resources_enabled: new FormControl<boolean>(false, { nonNullable: true }),
    hidden_resources_hide_on_creation: new FormControl<boolean>(false, { nonNullable: true }),
  });

  validationMessages: { [key: string]: IErrorMessages } = {
    title: {
      required: 'validation.required',
    },
  };

  // accessors
  get zoneValue() {
    return this.kbForm.controls.zone.value;
  }
  get hiddenResourcesEnabled() {
    return this.kbForm.controls.hidden_resources_enabled.value;
  }

  saving = false;
  standalone = this.standaloneService.standalone;

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private router: Router,
    private toast: SisToastService,
    private modal: SisModalService,
    private standaloneService: StandaloneService,
  ) {}

  ngOnInit(): void {
    merge(this.sdk.currentKb, this.sdk.currentRa)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((kb) => {
        this.kb = kb;
        this.resetKbForm();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  resetKbForm() {
    if (this.kb) {
      this.kbForm.patchValue({
        uid: this.kb.id,
        zone: this.kb.zone || '',
        slug: this.kb.slug,
        title: this.kb.title,
        description: this.kb.description || '',
        allowed_origins: (this.kb.allowed_origins || []).join('\n'),
        hidden_resources_enabled: this.kb.hidden_resources_enabled || false,
        hidden_resources_hide_on_creation: this.kb.hidden_resources_hide_on_creation || false,
      });
      this.kbForm.markAsPristine();
      this.cdr.markForCheck();
    }
  }

  saveKb(): void {
    if (this.kbForm.invalid || !this.kb) {
      return;
    }

    this.saving = true;
    const kbBackup = this.kb;
    const kbDetails = this.kbForm.getRawValue();

    const newSlug = STFUtils.generateSlug(kbDetails.slug);
    const oldSlug = kbBackup.slug || '';
    const isSlugUpdated = newSlug !== oldSlug;
    const origins = kbDetails.allowed_origins
      ?.split('\n')
      .map((origin) => origin.trim())
      .filter((origin) => !!origin);

    kbBackup
      .modify({
        title: kbDetails.title,
        description: kbDetails.description,
        slug: newSlug,
        allowed_origins: !!origins && origins.length > 0 ? origins : null,
        hidden_resources_enabled: kbDetails.hidden_resources_enabled,
        hidden_resources_hide_on_creation: kbDetails.hidden_resources_enabled
          ? kbDetails.hidden_resources_hide_on_creation
          : false,
      })
      .pipe(
        tap(() => this.toast.success(this.translate.instant('kb.settings.toasts.success'))),
        catchError(() => {
          this.toast.error(this.translate.instant('kb.settings.toasts.failure'));
          return of(undefined);
        }),
        switchMap(() =>
          this.sdk.currentAccount.pipe(
            switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, kbBackup.id, kbDetails.zone)),
          ),
        ),
      )
      .subscribe(() => {
        this.kbForm.markAsPristine();
        this.saving = false;
        this.sdk.refreshKbList(true);

        if (isSlugUpdated) {
          this.router.navigateByUrl(this.router.url.replace(oldSlug, newSlug));
        }
      });
  }

  toggleKbState() {
    if (!this.kb) {
      return;
    }
    const kb = this.kb;
    const isPublished = kb.state === 'PUBLISHED';
    const label = isPublished ? 'retire' : 'publish';
    const state = isPublished ? 'PRIVATE' : 'PUBLISHED';

    (
      this.modal.openConfirm({
        title: `stash.${label}.title`,
        description: this.translate.instant(`stash.${label}.warning`, { kb: kb.title }),
      }).onClose as Observable<boolean>
    )
      .pipe(
        filter((confirm) => confirm),
        switchMap(() => kb.publish(state === 'PUBLISHED').pipe(tap(() => this.sdk.refreshKbList(true)))),
        take(1),
      )
      .subscribe({
        next: () => this.cdr.markForCheck(),
        error: () => this.toast.error(`stash.${label}.error`),
      });
  }
}
