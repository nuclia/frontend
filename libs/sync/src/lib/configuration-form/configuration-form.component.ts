import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IConnector, ISyncEntity, Filters, Section } from '../logic';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, map, Observable, of, startWith, Subject, switchMap, take, takeUntil } from 'rxjs';
import { AssumeRoleInfo } from '@nuclia/core';
import { ParametersTableComponent, SDKService } from '@flaps/core';
import { InfoCardComponent, SisModalService, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { ModalConfig, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AssumeRoleModalComponent, HintModule } from '@flaps/common';
import { ConfigurationForm } from './configuration.model';
import { S3_IAM_POLICY } from '../logic/connectors/s3';
import { SyncOptions, SyncOptionsFormComponent } from '../sync-options-form';

const SLUGIFY = new RegExp(/[^a-z0-9_-]/g);

@Component({
  selector: 'nsy-configuration-form',
  imports: [
    CommonModule,
    HintModule,
    InfoCardComponent,
    TwoColumnsConfigurationItemComponent,
    ReactiveFormsModule,
    PaTextFieldModule,
    ParametersTableComponent,
    PaButtonModule,
    TranslateModule,
    PaTogglesModule,
    SyncOptionsFormComponent,
  ],
  templateUrl: './configuration-form.component.html',
  styleUrl: './configuration-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationFormComponent implements OnInit, OnDestroy {
  private modalService = inject(SisModalService);
  private cdr = inject(ChangeDetectorRef);
  private sdk = inject(SDKService);

  private unsubscribeAll = new Subject<void>();
  private connectorParametersBackup?: { [key: string]: unknown };

  @Input({ required: true }) connector?: IConnector | null;
  @Input({ required: true }) connectorId?: string | null;
  @Input({ required: true }) kbId?: string | null;
  @Input() set useOAuth(value: boolean) {
    this._useOAuth = value;
    this.updateExtraSections();
    this.updateValidators();
  }
  get useOAuth() {
    return this._useOAuth;
  }
  private _useOAuth = false;
  @Input() set enterCredentials(value: boolean) {
    this._enterCredentials = value;
    this.updateExtraSections();
    this.updateValidators();
  }
  get enterCredentials() {
    return this._enterCredentials;
  }
  private _enterCredentials = false;
  @Input() isCloud?: boolean = false;
  @Input() assumeRole?: boolean = false;
  syncEntity: ISyncEntity | undefined | null;
  @Input() set sync(value: ISyncEntity | undefined | null) {
    this.syncEntity = value;
    if (value) {
      this.connectorParametersBackup = value.connector.parameters;
      this.form.patchValue({
        name: value.title,
        syncSecurityGroups: value.syncSecurityGroups,
        preserveLabels: value.preserveLabels,
      });

      if (value.connector.parameters && !this.isCloud && !value.isCloud) {
        Object.entries(value.connector.parameters).forEach(([key, value]) => {
          if (typeof value !== 'object') {
            this._extra[key] = value;
          } else {
            this.tables[key] = value;
          }
        });
      }
    }
  }
  @Input({ transform: booleanAttribute }) noTopBorder = false;

  @Output() validForm = new EventEmitter<boolean>();
  @Output() configurationChange = new EventEmitter<ISyncEntity>();

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    syncSecurityGroups: new FormControl<boolean | null>(null),
    preserveLabels: new FormControl<boolean | null>(null),
    assumeRole: new FormGroup({
      external_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      role_arn: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    }),
    extra: new FormGroup({}),
  });

  tables: { [tableId: string]: { key: string; value: string; secret: boolean }[] } = {};
  invalidTables: string[] = [];
  files: { [id: string]: File } = {};
  assumeRoleInfo?: AssumeRoleInfo;
  currentOptions?: SyncOptions;

  private _extra: { [key: string]: string } = {};

  get assumeRoleForm() {
    return this.form.controls.assumeRole;
  }

  ngOnInit(): void {
    this.updateExtraSections();
    this.updateValidators();
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll), startWith(this.form.value)).subscribe(() => {
      this.validForm.emit(this.form.valid);
      this.emitSyncEntity();
    });
    if (this.assumeRole) {
      this.sdk.currentKb
        .pipe(
          take(1),
          switchMap((kb) => kb.syncManager.getAssumeRoleInfo()),
        )
        .subscribe((data) => {
          this.assumeRoleForm.patchValue({ external_id: data.external_id });
          this.assumeRoleInfo = data;
        });
    }
  }

  updateExtraSections() {
    Object.keys(this.form.controls.extra.controls).forEach((key) => {
      this.form.controls.extra.removeControl(key);
    });
    this.getExtraSections().subscribe((sections) => {
      sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type !== 'table') {
            this.form.controls.extra.addControl(
              field.id,
              new FormControl<string>('', {
                nonNullable: true,
                validators: field.required ? [Validators.required] : [],
              }),
            );
          }
        });
      });
      if (Object.keys(this._extra).length > 0) {
        this.form.patchValue({ extra: this._extra });
      }
    });
  }

  updateValidators() {
    this.form.controls.name.setValidators(this.enterCredentials ? [] : [Validators.required]);
    this.assumeRoleForm.controls.external_id.setValidators(this.assumeRole ? [Validators.required] : []);
    this.assumeRoleForm.controls.role_arn.setValidators(this.assumeRole ? [Validators.required] : []);
    this.form.controls.name.updateValueAndValidity();
    this.assumeRoleForm.controls.external_id.updateValueAndValidity();
    this.assumeRoleForm.controls.role_arn.updateValueAndValidity();
  }

  getExtraSections(): Observable<Section[]> {
    if (!this.connector) {
      return of([]);
    }
    return this.connector
      .getParametersSections()
      .pipe(
        map((sections) =>
          sections.filter(
            (section) =>
              (section.id === 'credentials' && this.enterCredentials && !this.useOAuth) ||
              (section.id !== 'credentials' && section.id !== 'folder' && !this.enterCredentials),
          ),
        ),
      );
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateTable(fieldId: string, values: { key: string; value: string; secret: boolean }[]) {
    this.tables[fieldId] = values;
    if (values.some((row) => (!row.value.trim() || !row.key.trim()) && !(!row.value.trim() && !row.key.trim()))) {
      if (!this.invalidTables.includes(fieldId)) {
        this.invalidTables.push(fieldId);
      }
    } else if (this.invalidTables.includes(fieldId)) {
      this.invalidTables = this.invalidTables.filter((id) => id !== fieldId);
    }
    this.cdr.markForCheck();
    this.emitSyncEntity();
  }

  onOptionsChange(options: SyncOptions) {
    this.currentOptions = options;
    this.emitSyncEntity();
  }

  private emitSyncEntity() {
    if (!this.connectorId) {
      return;
    }
    const config: ConfigurationForm = this.form.getRawValue();
    const title = config.name;
    const smallHash = (Math.random() + 1).toString(36).substring(7);
    const id = `${this.kbId}-${title?.toLowerCase().replace(SLUGIFY, '-')}-${smallHash}`;
    const extraParams: { [key: string]: string } = Object.entries(config.extra || {}).reduce(
      (fields, [key, value]) => {
        return { ...fields, [key]: value };
      },
      {} as { [key: string]: string },
    );
    const tables = Object.entries(this.tables).reduce(
      (validTables, [key, table]) => {
        if (Array.isArray(table)) {
          validTables[key] = table.filter((row) => !(!row.key.trim() || !row.value.trim()));
        }
        return validTables;
      },
      {} as { [tableId: string]: { key: string; value: string; secret: boolean }[] },
    );
    const assumeRole = this.assumeRole ? config.assumeRole : {};
    const opts = this.currentOptions;
    const filters: Filters = {
      fileExtensions: opts?.extensions?.length
        ? {
            extensions: opts.extensions.join(', '),
            exclude: opts.extensionMode === 'exclude',
          }
        : undefined,
      modified:
        opts?.from || opts?.to
          ? {
              from: opts.from || undefined,
              to: opts.to || undefined,
            }
          : undefined,
    };
    const syncEntity: ISyncEntity = {
      id,
      title,
      labels: opts?.labels,
      preserveLabels: config.preserveLabels || false,
      filters,
      connector: {
        name: this.connectorId,
        parameters: {
          ...this.connectorParametersBackup,
          ...tables,
          ...extraParams,
          ...assumeRole,
        },
      },
    };

    if (config.syncSecurityGroups !== null) {
      syncEntity.syncSecurityGroups = config.syncSecurityGroups;
    }
    syncEntity.extract_strategy = opts?.extractStrategy;
    this.configurationChange.emit(syncEntity);
  }

  updateFile(event: Event, fieldId: string, handleFile?: (file: File) => Observable<any>) {
    const file = (event.target as HTMLInputElement).files?.[0] || undefined;
    if (file && handleFile) {
      handleFile(file).subscribe((value) => {
        this.files[fieldId] = file;
        this.form.controls.extra.get(fieldId)?.setValue(value);
      });
    }
  }

  openAssumeRoleModal() {
    this.modalService
      .openModal(
        AssumeRoleModalComponent,
        new ModalConfig({
          data: {
            params: this.assumeRoleInfo,
            policy: S3_IAM_POLICY,
            zone: this.sdk.nuclia.options.zone,
            policyHelp: 'sync.add-page.assume-role.policy',
            title: 'sync.add-page.assume-role.role-arn.button',
            isBedrock: false,
          },
        }),
      )
      .onClose.pipe(filter((roleArn) => roleArn))
      .subscribe((roleArn) => {
        this.assumeRoleForm.controls.role_arn.patchValue(roleArn);
        this.cdr.markForCheck();
      });
  }
}
