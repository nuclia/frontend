import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { switchMap, take } from 'rxjs';
import { ConnectorDefinition, ConnectorParameters, Field } from '../sync/models';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'da-connectors',
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorsComponent {
  private _type: 'sources' | 'destinations' = 'sources';
  @Input() set type(value: 'sources' | 'destinations') {
    this._type = value;
    this.connectors = this.sync.getConnectors(value);
    this.cdr?.markForCheck();
  }
  @Output() onSelect = new EventEmitter<{ connector: ConnectorDefinition; params?: ConnectorParameters }>();
  connectors: ConnectorDefinition[] = [];
  fields?: Field[];
  form?: FormGroup;
  selectedConnector?: ConnectorDefinition;

  constructor(private sync: SyncService, private cdr: ChangeDetectorRef, private formBuilder: FormBuilder) {}

  selectConnector(connectorId: string) {
    this.selectedConnector = this.sync[this._type][connectorId].definition;
    if (this._type === 'sources') {
      this.onSelect.emit({ connector: this.selectedConnector });
    } else {
      this.sync
        .getDestination(connectorId)
        .pipe(
          switchMap((destination) => destination.getParameters()),
          take(1),
        )
        .subscribe((fields) => {
          this.fields = fields;
          this.form = this.formBuilder.group(fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {}));
          this.cdr?.detectChanges();
        });
    }
  }

  validate() {
    if (this.selectedConnector) {
      this.onSelect.emit({ connector: this.selectedConnector, params: this.form?.value });
    }
  }
}
