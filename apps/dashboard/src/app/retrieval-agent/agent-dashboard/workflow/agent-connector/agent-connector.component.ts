import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { AgentBoxComponent, ArrowDownComponent, ConnectableEntryComponent, NodeDirective } from '../basic-elements';

@Component({
  selector: 'app-agent-connector',
  imports: [CommonModule, AgentBoxComponent, ConnectableEntryComponent, PaTranslateModule, ArrowDownComponent],
  templateUrl: './agent-connector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentConnectorComponent extends NodeDirective {}
