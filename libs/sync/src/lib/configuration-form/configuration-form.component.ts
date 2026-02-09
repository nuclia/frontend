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
import { Filters, IConnector, ISyncEntity, Section } from '../logic';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, map, Observable, of, startWith, Subject, take, takeUntil } from 'rxjs';
import { Classification, LabelSetKind, LabelSets } from '@nuclia/core';
import { LabelModule, LabelSetFormModalComponent, LabelsService, ParametersTableComponent } from '@flaps/core';
import {
  InfoCardComponent,
  SisLabelModule,
  SisModalService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import {
  ModalConfig,
  PaButtonModule,
  PaDatePickerModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ColoredLabel, ExtractionSelectComponent } from '@flaps/common';
import { ConfigurationForm, FiltersResources } from './configuration.model';

const SLUGIFY = new RegExp(/[^a-z0-9_-]/g);

@Component({
  selector: 'nsy-configuration-form',
  imports: [
    CommonModule,
    InfoCardComponent,
    TwoColumnsConfigurationItemComponent,
    ReactiveFormsModule,
    PaTextFieldModule,
    ParametersTableComponent,
    LabelModule,
    PaButtonModule,
    TranslateModule,
    PaDatePickerModule,
    SisLabelModule,
    PaTogglesModule,
    ExtractionSelectComponent,
  ],
  templateUrl: './configuration-form.component.html',
  styleUrl: './configuration-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationFormComponent implements OnInit, OnDestroy {
  private labelService = inject(LabelsService);
  private modalService = inject(SisModalService);
  private cdr = inject(ChangeDetectorRef);

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
  @Input() set sync(value: ISyncEntity | undefined | null) {
    if (value) {
      this.connectorParametersBackup = value.connector.parameters;
      const filterResources: FiltersResources = {
        extensions: value.filters?.fileExtensions?.extensions || '',
        extensionUsage: value.filters?.fileExtensions?.exclude ? 'exclude' : 'include',
        from: value.filters?.modified?.from || '',
        to: value.filters?.modified?.to || '',
      };
      this.form.patchValue({
        name: value.title,
        syncSecurityGroups: value.syncSecurityGroups,
        filterResources,
        preserveLabels: value.preserveLabels,
      });
      this.labelSelection = value.labels || [];
      this.extensionList = this.formatExtensionList(filterResources.extensions);
      if (value.extract_strategy) {
        this.extractStrategy = value.extract_strategy;
      }

      if (value.connector.parameters) {
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
    filterResources: new FormGroup({
      extensions: new FormControl<string>('', { updateOn: 'blur' }),
      extensionUsage: new FormControl<'include' | 'exclude'>('include', { nonNullable: true }),
      from: new FormControl(''),
      to: new FormControl(''),
    }),
    extra: new FormGroup({}),
  });

  labelSets: Observable<LabelSets | null> = this.labelService.resourceLabelSets;
  hasLabelSet: Observable<boolean> = this.labelService.hasResourceLabelSets;
  labelSelection: ColoredLabel[] = [];

  extensionList: string[] = [];
  tables: { [tableId: string]: { key: string; value: string; secret: boolean }[] } = {};
  invalidTables: string[] = [];
  extractStrategy: string | undefined = '';
  files: { [id: string]: File } = {};

  private _extra: { [key: string]: string } = {};

  get extensionsControl() {
    return this.form.controls.filterResources.controls.extensions;
  }

  ngOnInit(): void {
    this.updateExtraSections();
    this.updateValidators();
    this.extensionsControl.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((value) => (this.extensionList = this.formatExtensionList(value)));
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll), startWith(this.form.value)).subscribe(() => {
      this.validForm.emit(this.form.valid);
      this.emitSyncEntity();
    });
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
    this.form.controls.name.updateValueAndValidity();
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

  createLabelSet() {
    this.modalService.openModal(
      LabelSetFormModalComponent,
      new ModalConfig({ data: { kind: LabelSetKind.RESOURCES } }),
    );
  }

  updateLabelSelection(labels: Classification[]) {
    this.labelSets
      .pipe(
        take(1),
        filter((labelSets) => !!labelSets),
        map((labelSets) => labelSets as LabelSets),
      )
      .subscribe((labelSets) => {
        this.labelSelection = labels.map((label) => ({ ...label, color: labelSets[label.labelset]?.color }));
        this.emitSyncEntity();
      });
  }

  removeExtension(extension: string) {
    const extensions = this.extensionList.filter((item) => item !== extension);
    this.extensionsControl.patchValue(extensions.join(', '));
  }

  removeLabel(label: ColoredLabel) {
    this.labelSelection = this.labelSelection.filter(
      (item) => !(item.labelset === label.labelset && item.label === label.label),
    );
    this.emitSyncEntity();
  }

  private formatExtensionList(value: string | null): string[] {
    return value && value.length > 0
      ? value
          .split(',')
          .map((extension) => extension.trim())
          .filter((value) => !!value)
      : [];
  }

  private emitSyncEntity() {
    if (!this.connectorId) {
      return;
    }
    const config: ConfigurationForm = this.form.getRawValue();
    const title = config.name;
    const smallHash = (Math.random() + 1).toString(36).substring(7);
    const id = `${this.kbId}-${title?.toLowerCase().replace(SLUGIFY, '-')}-${smallHash}`;
    const filters: Filters = {
      fileExtensions: config.filterResources.extensions
        ? {
            extensions: config.filterResources.extensions,
            exclude: config.filterResources.extensionUsage === 'exclude',
          }
        : undefined,
      modified:
        config.filterResources.from || config.filterResources.to
          ? {
              from: config.filterResources.from || undefined,
              to: config.filterResources.to || undefined,
            }
          : undefined,
    };
    const extraParams: { [key: string]: string } = Object.entries(config.extra || {}).reduce(
      (fields, [key, value]) => {
        return { ...fields, [key]: value };
      },
      {} as { [key: string]: string },
    );
    const tables = Object.entries(this.tables).reduce(
      (validTables, [key, table]) => {
        validTables[key] = table.filter((row) => !(!row.key.trim() || !row.value.trim()));
        return validTables;
      },
      {} as { [tableId: string]: { key: string; value: string; secret: boolean }[] },
    );
    const syncEntity: ISyncEntity = {
      id,
      title,
      labels: this.labelSelection,
      preserveLabels: config.preserveLabels || false,
      filters,
      connector: {
        name: this.connectorId,
        parameters: {
          ...this.connectorParametersBackup,
          ...tables,
          ...extraParams,
        },
      },
    };
    if (config.syncSecurityGroups !== null) {
      syncEntity.syncSecurityGroups = config.syncSecurityGroups;
    }
    syncEntity.extract_strategy = this.extractStrategy;
    this.configurationChange.emit(syncEntity);
  }

  updateExtractStrategy(strategy: string | undefined) {
    this.extractStrategy = strategy;
    this.validForm.emit(this.form.valid);
    this.emitSyncEntity();
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
}
