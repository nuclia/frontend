import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { switchMap, take } from 'rxjs';
import { ConnectorDefinition, ConnectorParameters, Field } from '../sync/models';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-connectors',
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
  @Output() selectConnector = new EventEmitter<{ connector: ConnectorDefinition; params?: ConnectorParameters }>();
  connectors: ConnectorDefinition[] = [];
  fields?: Field[];
  form?: UntypedFormGroup;
  selectedConnector?: ConnectorDefinition;

  constructor(private sync: SyncService, private cdr: ChangeDetectorRef, private formBuilder: UntypedFormBuilder) {}

  onSelectConnector(connectorId: string) {
    this.selectedConnector = this.sync[this._type][connectorId].definition;
    if (this._type === 'sources') {
      this.selectConnector.emit({ connector: this.selectedConnector });
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
      this.selectConnector.emit({ connector: this.selectedConnector, params: this.form?.value });
    }
  }
}
