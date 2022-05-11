import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { take } from 'rxjs';
import { ConnectorSettings, Field, IConnector, IDestinationConnector } from '../sync/models';
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
  }
  @Output() onSelect = new EventEmitter<{ connector: IConnector; settings?: ConnectorSettings }>();
  connectors: IConnector[] = [];
  fields?: Field[];
  form?: FormGroup;
  selectedConnector?: IConnector;

  constructor(private sync: SyncService, private cdr: ChangeDetectorRef, private formBuilder: FormBuilder) {}

  selectConnector(connectorId: string) {
    this.selectedConnector = this.sync[this._type][connectorId];
    if (this._type === 'sources') {
      this.onSelect.emit({ connector: this.selectedConnector });
    } else {
      (this.selectedConnector as IDestinationConnector)
        .getParameters()
        .pipe(take(1))
        .subscribe((fields) => {
          this.fields = fields;
          this.form = this.formBuilder.group(fields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {}));
          this.cdr?.detectChanges();
        });
    }
  }

  validate() {
    if (this.selectedConnector) {
      this.onSelect.emit({ connector: this.selectedConnector, settings: this.form?.value });
    }
  }
}
