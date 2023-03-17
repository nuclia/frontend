import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { filter, Subject, switchMap, take, takeUntil } from 'rxjs';
import { ConnectorDefinition, ConnectorParameters, Field } from '../sync/models';
import { SyncService } from '../sync/sync.service';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nde-connectors',
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorsComponent implements OnDestroy {
  private _type: 'sources' | 'destinations' = 'sources';
  private _connectorIds?: string[];
  private sources: ConnectorDefinition[] = [];
  private unsubscribeAll = new Subject<void>();

  @Input()
  set type(value: 'sources' | 'destinations') {
    this._type = value;
    this.getConnectors();
  }
  get type() {
    return this._type;
  }

  @Input()
  set connectorIds(value: string[] | undefined) {
    this._connectorIds = value;
    this.getConnectors();
  }
  get connectorIds() {
    return this._connectorIds;
  }

  @Input()
  set quickAccess(value: { connectorId: string; quickAccessName: string }) {
    if (value) {
      this.quickAccessName = value.quickAccessName;
      this.onSelectConnector(value.connectorId);
    }
  }

  @Output() cancel = new EventEmitter<void>();
  @Output() selectConnector = new EventEmitter<{ connector: ConnectorDefinition; params: ConnectorParameters }>();

  connectors: ConnectorDefinition[] = [];
  fields?: Field[];
  form?: UntypedFormGroup;
  selectedConnector?: ConnectorDefinition;
  canStoreParams = false;
  quickAccessName?: string;
  step = this.sync.step;

  constructor(private sync: SyncService, private cdr: ChangeDetectorRef, private formBuilder: UntypedFormBuilder) {
    this.sync.sourceObs.pipe(takeUntil(this.unsubscribeAll)).subscribe((sources) => {
      if (this.type === 'sources') {
        this.connectors = sources;
        markForCheck(this.cdr);
      }
    });
    this.step
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((step) => step === 0),
      )
      .subscribe(() => {
        this.form = undefined;
        this.fields = undefined;
        this.selectedConnector = undefined;
        this.quickAccessName = undefined;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  getConnectors() {
    this.connectors = this.sync.getConnectors(this.type);
    if (this.connectorIds) {
      this.connectors = this.connectors.filter((connector) => (this.connectorIds || []).includes(connector.id));
    }
    if (this.connectors.length === 1 && this.type === 'destinations') {
      this.onSelectConnector(this.connectors[0].id);
    }
    markForCheck(this.cdr);
  }

  onSelectConnector(connectorId: string) {
    this.selectedConnector = this.sync[this._type][connectorId].definition;
    if (this._type === 'sources') {
      this.sync
        .getSource(this.selectedConnector.id)
        .pipe(
          switchMap((source) => source.getParameters()),
          take(1),
        )
        .subscribe((fields) => {
          if (fields.length > 0) {
            this.sync.setStep(1);
            this.showFields(connectorId, fields);
          } else {
            this.selectedConnector && this.selectConnector.emit({ connector: this.selectedConnector, params: {} });
          }
        });
    } else {
      this.sync
        .getDestination(connectorId)
        .pipe(
          switchMap((destination) => destination.getParameters()),
          take(1),
        )
        .subscribe((fields) => {
          this.showFields(connectorId, fields);
        });
    }
  }

  showFields(connectorId: string, fields: Field[]) {
    this.fields = fields;
    this.canStoreParams = this.type === 'sources' && this.fields.every((field) => field.type !== 'folder');
    this.form = this.formBuilder.group({
      fields: this.formBuilder.group(
        fields.reduce((acc, field) => ({ ...acc, [field.id]: ['', field.required ? [Validators.required] : []] }), {}),
      ),
      quickAccess: this.formBuilder.group({
        enabled: [this.canStoreParams],
        name: ['', this.canStoreParams ? [Validators.required] : []],
      }),
    });
    if (this.quickAccessName) {
      const cache = this.sync.getConnectorCache(connectorId, this.quickAccessName);
      if (cache) {
        this.form.patchValue({ fields: cache.params, quickAccess: { name: this.quickAccessName } });
      }
    }
    markForCheck(this.cdr);
  }

  updateValidators(saveCredentials: boolean) {
    const name = this.form?.get('quickAccess')?.get('name');
    saveCredentials ? name?.addValidators(Validators.required) : name?.removeValidators(Validators.required);
    // force validation to be refreshed
    this.form?.patchValue({ quickAccess: { name: this.form?.value.quickAccess.name } });
    this.form?.updateValueAndValidity();
  }

  validate() {
    if (this.selectedConnector) {
      if (this.quickAccessName) {
        if (!this.form?.value.quickAccess.enabled || this.form?.value.quickAccess.name !== this.quickAccessName) {
          this.sync.removeConnectorCache(this.selectedConnector.id, this.quickAccessName);
        }
      }
      if (this.form?.value.quickAccess.enabled) {
        this.sync.saveConnectorCache(
          this.selectedConnector.id,
          this.form?.value.quickAccess.name,
          this.form?.value.fields || {},
        );
      }
      this.selectConnector.emit({ connector: this.selectedConnector, params: this.form?.value.fields || {} });
    }
  }

  refreshField(id: string) {
    if (this.selectedConnector) {
      this.sync
        .getDestination(this.selectedConnector.id)
        .pipe(
          take(1),
          switchMap((destination) => destination.refreshField(id)),
          filter((field) => !!field),
        )
        .subscribe((field: Field) => {
          this.fields = (this.fields || []).map((f) => (f.id === field.id ? field : f));
          markForCheck(this.cdr);
        });
    }
  }
}
