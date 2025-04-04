import { Directive, input, output, ViewChild } from '@angular/core';
import { AgentBoxComponent } from './agent-box/agent-box.component';
import { ConnectableEntryComponent } from './connectable-entry/connectable-entry.component';

let nodeCount = 0;

@Directive({})
export class NodeDirective {
  readonly id = `node-${nodeCount++}`;
  nextColumnIndex = 0;
  origin = input<ConnectableEntryComponent>();
  state = input<'default' | 'selected' | 'processing' | 'processed'>('default');
  addNode = output<{ entry: ConnectableEntryComponent; targetColumn: number }>();

  @ViewChild(AgentBoxComponent) boxComponent?: AgentBoxComponent;

  onOutputClick(entry: ConnectableEntryComponent) {
    this.addNode.emit({ entry, targetColumn: this.nextColumnIndex });
  }
}
