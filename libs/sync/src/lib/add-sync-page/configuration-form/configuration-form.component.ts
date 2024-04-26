import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Filters, IConnector, ISyncEntity } from '../../logic';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, map, Observable, Subject, take, takeUntil } from 'rxjs';
import { Classification, LabelSets } from '@nuclia/core';
import { LabelModule, LabelSetFormModalComponent, LabelsService, ParametersTableComponent } from '@flaps/core';
import {
  InfoCardComponent,
  SisLabelModule,
  SisModalService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import {
  PaButtonModule,
  PaDatePickerModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ColoredLabel } from '@flaps/common';
import { ConfigurationForm, FiltersResources } from './configuration.model';

const SLUGIFY = new RegExp(/[^a-z0-9_-]/g);

@Component({
  selector: 'nsy-configuration-form',
  standalone: true,
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
  ],
  templateUrl: './configuration-form.component.html',
  styleUrl: './configuration-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationFormComponent implements OnInit, OnDestroy {
  private labelService = inject(LabelsService);
  private modalService = inject(SisModalService);
  private unsubscribeAll = new Subject<void>();

  @Input({ required: true }) connector?: IConnector;
  @Input({ required: true }) connectorId?: string | null;
  @Input({ required: true }) kbId?: string | null;
  @Input() set sync(value: ISyncEntity | undefined | null) {
    if (value) {
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
      });
      this.labelSelection = value.labels || [];
      this.extensionList = filterResources.extensions?.split(', ') || [];
      // TODO load tables
    }
  }

  @Output() validForm = new EventEmitter<boolean>();
  @Output() configurationChange = new EventEmitter<ISyncEntity>();

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    syncSecurityGroups: new FormControl<boolean | null>(null),
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

  get extensionsControl() {
    return this.form.controls.filterResources.controls.extensions;
  }

  ngOnInit(): void {
    if (this.connector) {
      this.connector.getParametersSections().subscribe((sections) => {
        sections.forEach((section) =>
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
          }),
        );
      });
    }
    this.extensionsControl.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((value) => {
      this.extensionList = value && value.length > 0 ? value.split(',').map((extension) => extension.trim()) : [];
    });
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.validForm.emit(this.form.valid);
      this.emitSyncEntity();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateTable(fieldId: string, values: { key: string; value: string; secret: boolean }[]) {
    this.tables[fieldId] = values;
  }

  createLabelSet() {
    this.modalService.openModal(LabelSetFormModalComponent);
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

  private emitSyncEntity() {
    if (!this.connectorId) {
      return;
    }
    const config: ConfigurationForm = this.form.getRawValue();
    const title = config.name;
    const id = `${this.kbId}-${title?.toLowerCase().replace(SLUGIFY, '-')}`;
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
    const extraParams: { [key: string]: string } = Object.values(config.extra || {}).reduce(
      (fields, section) => {
        return { ...fields, ...section };
      },
      {} as { [key: string]: string },
    );
    const syncEntity: ISyncEntity = {
      id,
      title,
      labels: this.labelSelection,
      filters,
      connector: {
        name: this.connectorId,
        parameters: {
          ...this.tables,
          ...extraParams,
        },
      },
    };
    if (config.syncSecurityGroups !== null) {
      syncEntity.syncSecurityGroups = config.syncSecurityGroups;
    }
    this.configurationChange.emit(syncEntity);
  }
}
