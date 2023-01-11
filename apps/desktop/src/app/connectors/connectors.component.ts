import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { filter, switchMap, take } from 'rxjs';
import { ConnectorDefinition, ConnectorParameters, Field } from '../sync/models';
import { SyncService } from '../sync/sync.service';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';

const PARAMS_CACHE = 'PARAMS_CACHE';
@Component({
  selector: 'nde-connectors',
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorsComponent {
  private _type: 'sources' | 'destinations' = 'sources';
  private _connectorIds?: string[];

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

  @Output() cancel = new EventEmitter<void>();
  @Output() selectConnector = new EventEmitter<{ connector: ConnectorDefinition; params: ConnectorParameters }>();

  connectors: ConnectorDefinition[] = [];
  fields?: Field[];
  form?: UntypedFormGroup;
  selectedConnector?: ConnectorDefinition;

  constructor(private sync: SyncService, private cdr: ChangeDetectorRef, private formBuilder: UntypedFormBuilder) {}

  getConnectors() {
    this.connectors = this.sync.getConnectors(this.type);
    if (this.connectorIds) {
      this.connectors = this.connectors.filter((connector) => (this.connectorIds || []).includes(connector.id));
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
          fields.length > 0
            ? this.showFields(connectorId, fields)
            : this.selectedConnector && this.selectConnector.emit({ connector: this.selectedConnector, params: {} });
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
    this.form = this.formBuilder.group(
      fields.reduce((acc, field) => ({ ...acc, [field.id]: ['', field.required ? [Validators.required] : []] }), {}),
    );
    const cache = this.getCache(connectorId);
    if (cache) {
      this.form.patchValue(cache);
    }
    markForCheck(this.cdr);
  }

  validate() {
    if (this.selectedConnector) {
      this.saveCache(this.selectedConnector.id, this.form?.value || {});
      this.selectConnector.emit({ connector: this.selectedConnector, params: this.form?.value || {} });
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

  private getCache(connectorId: string): any {
    const cache = localStorage.getItem(PARAMS_CACHE) || '{}';
    return JSON.parse(cache)[connectorId];
  }

  private saveCache(connectorId: string, params: any) {
    const cache = localStorage.getItem(PARAMS_CACHE) || '{}';
    const parsedCache = JSON.parse(cache);
    localStorage.setItem(PARAMS_CACHE, JSON.stringify({ ...parsedCache, [connectorId]: params }));
  }
}
