import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  BehaviorSubject,
  debounceTime,
  catchError,
  delay,
  filter,
  forkJoin,
  map,
  merge,
  Observable,
  of,
  switchMap,
  take,
  tap,
  Subject,
  takeUntil,
} from 'rxjs';
import { IErrorMessages, markForCheck } from '@guillotinaweb/pastanaga-angular';
import { UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { SyncService } from '../../sync/sync.service';
import { ConnectorDefinition, Field } from '../../sync/models';
import { SDKService } from '@flaps/core';
import { Classification, KnowledgeBox, LabelSets, Nuclia } from '@nuclia/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'nde-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnDestroy, OnInit {
  validationMessages: { [key: string]: IErrorMessages } = {
    name: {
      pattern: 'Use only letters, numbers, dashes and underscores',
    } as IErrorMessages,
  };

  @Input() addNew: string;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<{
    name: string;
    connectorId: string;
  }>();

  fields?: Field[];
  kbField?: Field;
  localKbField?: Field;
  form?: UntypedFormGroup;
  connector?: ConnectorDefinition;
  selectedLabels: Classification[] = [];
  dashboardUrl = '';
  labelSets = new BehaviorSubject<LabelSets | null>(null);
  hasLabelSets = this.labelSets.pipe(map((labelSets) => Object.keys(labelSets || {}).length > 0));
  unsubscribeAll = new Subject<void>();

  constructor(
    private sync: SyncService,
    private cdr: ChangeDetectorRef,
    private formBuilder: UntypedFormBuilder,
    private sdk: SDKService,
  ) {}

  get local(): boolean {
    return !!this.form?.value.local;
  }

  get localUrl(): string | undefined {
    return this.form?.value.localUrl;
  }

  ngOnInit() {
    const source = this.sync.getSourceCache(this.sync.getCurrentSourceId() || '');
    const connectorId = this.addNew ? this.addNew : source.connectorId;
    this.sync.sourceObs
      .pipe(
        map((sources) => sources.find((source) => source.id === connectorId)),
        filter((connector) => !!connector),
        tap((connector) => (this.connector = connector)),
        switchMap(() => this._refreshKbs(!!source?.kb?.standalone)),
        switchMap(() =>
          this.sync.getSource(connectorId, this.addNew ? '' : this.sync.getCurrentSourceId() || '').pipe(
            switchMap((source) => source.getParameters()),
            tap((fields) => this.showFields(fields)),
          ),
        ),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  showFields(fields: Field[]) {
    this.fields = fields;
    this.form = this.formBuilder.group({
      fields: this.formBuilder.group(
        fields.reduce((acc, field) => ({ ...acc, [field.id]: ['', this.getFieldValidators(field)] }), {}),
      ),
      permanentSync: [!!this.connector?.permanentSyncOnly],
      name: ['', [Validators.required, Validators.pattern('[a-zA-Z-0-9-_]+')]],
      kb: ['', [Validators.required]],
      local: [false],
      localUrl: [''],
      localKb: [''],
    });
    merge(
      this.form.controls.kb.valueChanges.pipe(
        delay(10), // wait until form is updated
        filter(() => !this.local),
      ),
      this.form.controls.localKb.valueChanges.pipe(
        delay(10), // wait until form is updated
        filter(() => this.local),
      ),
    )
      .pipe(
        switchMap((kb) => this._onSelectKb(kb)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();

    this.form?.controls.localUrl?.valueChanges
      .pipe(
        debounceTime(500),
        switchMap(() => this._refreshKbs(this.local)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();

    if (!this.addNew) {
      const cache = this.sync.getSourceCache(this.sync.getCurrentSourceId() || '');
      if (cache) {
        this.selectedLabels = cache.labels || [];
        const local = !!cache.kb?.standalone;
        this.form.patchValue({
          fields: cache.data,
          name: this.sync.getCurrentSourceId() || '',
          kb: local ? '' : cache.kb?.knowledgeBox || '',
          local,
          localUrl: cache.kb?.standalone ? cache?.kb.backend : '',
          localKb: local ? cache.kb?.knowledgeBox || '' : '',
          permanentSync: cache.permanentSync,
        });
        this.updateValidators(local);
      }
    }
    markForCheck(this.cdr);
  }

  getFieldValidators(field: Field) {
    const validators: ValidatorFn[] = [];
    if (field.required) {
      validators.push(Validators.required);
    }
    if (field.pattern) {
      validators.push(Validators.pattern(field.pattern));
    }
    return validators;
  }

  validate() {
    const kbId = (this.local ? this.form?.value.localKb : this.form?.value.kb).split('|')[0];
    this.sync
      .setSourceData(this.form?.value.name || '', {
        connectorId: this.connector?.id || '',
        data: this.form?.value.fields || {},
        permanentSync: this.form?.value.permanentSync,
      })
      .pipe(
        switchMap(() =>
          this.sync.setSourceDestination(
            this.form?.value.name || '',
            kbId,
            this.local ? this.localUrl : undefined,
            this.selectedLabels,
          ),
        ),
      )
      .subscribe(() => {
        this.save.emit({
          name: this.form?.value.name || '',
          connectorId: this.connector?.id || '',
        });
      });
  }

  refreshKbs(local: boolean) {
    this._refreshKbs(local).subscribe();
  }

  private _refreshKbs(local: boolean) {
    if (local && !this.localUrl) {
      this.localKbField = undefined;
      this.cdr.markForCheck();
      return of(undefined);
    }
    return this.getDestination(local).pipe(
      take(1),
      switchMap((destination) => destination.refreshField('kb')),
      tap((field: Field) => {
        if (local) {
          this.localKbField = field;
        } else {
          this.kbField = field;
        }
        markForCheck(this.cdr);
      }),
      catchError(() => {
        if (local) {
          this.localKbField = undefined;
          this.form?.controls.localUrl.setErrors({ invalid: true });
          this.form?.controls.localUrl.markAsDirty();
          this.form?.controls.localKb.reset();
          markForCheck(this.cdr);
        }
        return of(undefined);
      }),
      map(() => undefined),
    );
  }

  goToUrl(event: MouseEvent, url: string) {
    if ((window as any)['electron']) {
      event.preventDefault();
      (window as any)['electron'].openExternal(url);
    }
  }

  onCancel() {
    if (this.addNew) {
      this.cancel.emit();
    } else {
      this.sync.showSource.next({
        connectorId: this.connector?.id || '',
        sourceId: this.sync.getCurrentSourceId() || '',
      });
    }
  }

  private _onSelectKb(kbId: string | undefined): Observable<undefined> {
    if (!kbId) {
      this.labelSets.next(null);
      this.selectedLabels = [];
      this.cdr.markForCheck();
      return of(undefined);
    }
    const setDashboardUrl: Observable<string> = !this.local
      ? forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.kbList.pipe(take(1))]).pipe(
          map(([account, kbs]) => {
            const kb = kbs.find((kb) => kb.id === kbId);
            this.dashboardUrl = this.getDashboardUrl(environment.dashboard, account.slug, kb?.slug || '');
            return account.slug;
          }),
        )
      : of(this.getDashboardUrl(`${this.localUrl?.split('/api')?.[0]}/contributor/#/contributor`, 'local', kbId)).pipe(
          map((url) => {
            this.dashboardUrl = url;
            return 'local';
          }),
        );
    return setDashboardUrl.pipe(
      switchMap((account) => this.getKb(account, kbId).getLabels()),
      tap((labelSets) => {
        this.labelSets.next(labelSets);
        this.selectedLabels = this.selectedLabels.filter((label) =>
          (labelSets[label.labelset]?.labels || []).some((item) => item.title === label.label),
        );
        this.cdr.markForCheck();
      }),
      map(() => undefined),
    );
  }

  getDashboardUrl(path: string, account: string, kb: string) {
    return `${path}/at/${account}/${kb}/label-sets/list`;
  }

  getKb(account: string, kbId: string): KnowledgeBox {
    const nuclia = this.local
      ? new Nuclia({
          backend: this.localUrl || '',
          client: environment.client,
          standalone: true,
        })
      : this.sdk.nuclia;
    return new KnowledgeBox(nuclia, account, { id: kbId, zone: '' });
  }

  getDestination(local: boolean) {
    let settings = {};
    if (local) {
      const source = this.sync.getSourceCache(this.sync.getCurrentSourceId() || '');
      settings = {
        standalone: true,
        backend: this.localUrl || source?.kb?.backend,
      };
    }
    return this.sync.getDestination('nucliacloud', settings);
  }

  onToggleLocal(local: boolean) {
    this.updateValidators(local);
    this._refreshKbs(local)
      .pipe(switchMap(() => this._onSelectKb(local ? this.form?.value.localKb : this.form?.value.kb)))
      .subscribe();
    this.cdr.markForCheck();
  }

  updateValidators(local: boolean) {
    this.form?.controls.kb.setValidators(local ? [] : [Validators.required]);
    this.form?.controls.localKb.setValidators(local ? [Validators.required] : []);
    this.form?.controls.localUrl.setValidators(local ? [Validators.required] : []);
    this.form?.controls.kb?.updateValueAndValidity();
    this.form?.controls.localKb?.updateValueAndValidity();
    this.form?.controls.localUrl?.updateValueAndValidity();
  }
}
