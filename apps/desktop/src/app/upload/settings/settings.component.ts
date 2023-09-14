import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { combineLatest, filter, map, switchMap, take, tap } from 'rxjs';
import { IErrorMessages, markForCheck } from '@guillotinaweb/pastanaga-angular';
import { UntypedFormBuilder, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { SyncService } from '../../sync/sync.service';
import { ConnectorDefinition, Field } from '../../sync/models';

@Component({
  selector: 'nde-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
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
  form?: UntypedFormGroup;
  connector?: ConnectorDefinition;

  constructor(private sync: SyncService, private cdr: ChangeDetectorRef, private formBuilder: UntypedFormBuilder) {}

  ngOnInit() {
    const source = this.sync.getSourceCache(this.sync.getCurrentSourceId() || '');
    const connectorId = this.addNew ? this.addNew : source.connectorId;
    this.sync.sourceObs
      .pipe(
        map((sources) => sources.find((source) => source.id === connectorId)),
        filter((connector) => !!connector),
        tap((connector) => {
          this.connector = connector;
        }),
        switchMap(() => combineLatest([this.sync.getSource(connectorId), this.sync.getDestination('nucliacloud')])),
        switchMap(([source, destination]) => combineLatest([source.getParameters(), destination.getParameters()])),
        take(1),
      )
      .subscribe(([fields, destinationFields]) => {
        this.showFields(fields, destinationFields[0]);
      });
  }

  showFields(fields: Field[], kbField: Field) {
    this.fields = fields;
    this.kbField = kbField;
    this.form = this.formBuilder.group({
      fields: this.formBuilder.group(
        fields.reduce((acc, field) => ({ ...acc, [field.id]: ['', this.getFieldValidators(field)] }), {}),
      ),
      permanentSync: [!!this.connector?.permanentSyncOnly],
      name: ['', [Validators.required, Validators.pattern('[a-zA-Z-0-9-_]+')]],
      kb: ['', this.getFieldValidators(kbField)],
    });
    if (!this.addNew) {
      const cache = this.sync.getSourceCache(this.sync.getCurrentSourceId() || '');
      if (cache) {
        this.form.patchValue({
          fields: cache.data,
          name: this.sync.getCurrentSourceId() || '',
          kb: cache.kb?.knowledgeBox || '',
          permanentSync: cache.permanentSync,
        });
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
    this.sync
      .setSourceData(this.form?.value.name || '', {
        connectorId: this.connector?.id || '',
        data: this.form?.value.fields || {},
        permanentSync: this.form?.value.permanentSync,
      })
      .pipe(switchMap(() => this.sync.setSourceDestination(this.form?.value.name || '', this.form?.value.kb || '')))
      .subscribe(() => {
        this.save.emit({
          name: this.form?.value.name || '',
          connectorId: this.connector?.id || '',
        });
      });
  }

  refreshField(id: string) {
    this.sync
      .getDestination('nucliacloud')
      .pipe(
        take(1),
        switchMap((destination) => destination.refreshField(id)),
        filter((field) => !!field),
      )
      .subscribe((field: Field) => {
        this.kbField = field;
        markForCheck(this.cdr);
      });
  }

  goToDocumentation(event: MouseEvent, url: string) {
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
}
