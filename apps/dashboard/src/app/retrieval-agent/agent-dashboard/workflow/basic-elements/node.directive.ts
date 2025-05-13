import { Directive, HostListener, input, output, ViewChild } from '@angular/core';
import { NodeCategory, NodeConfig } from '../workflow.models';
import { ConnectableEntryComponent } from './connectable-entry/connectable-entry.component';
import { NodeBoxComponent } from './node-box/node-box.component';

let nodeCount = 0;

@Directive({})
export class NodeDirective {
  readonly id = `node-${nodeCount++}`;
  columnIndex = 0;

  origin = input<ConnectableEntryComponent>();
  state = input<'default' | 'selected' | 'processing' | 'processed'>('default');
  config = input<NodeConfig>();
  category = input.required<NodeCategory>();

  addNode = output<{ entry: ConnectableEntryComponent; targetColumn: number }>();
  removeNode = output();
  selectNode = output();
  configUpdated = output();

  @ViewChild(NodeBoxComponent) boxComponent!: NodeBoxComponent;

  /**
   * Select the node on click only when not clicking on an output button
   * @param event MouseEvent
   */
  @HostListener('click', ['$event']) onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (
      target.classList.contains('output') ||
      target.parentElement?.classList.contains('output') ||
      target.parentElement?.parentElement?.classList.contains('output')
    ) {
      return;
    }
    this.selectNode.emit();
  }

  onOutputClick(entry: ConnectableEntryComponent) {
    this.addNode.emit({ entry, targetColumn: this.columnIndex + 1 });
  }
  onTrashClick() {
    this.removeNode.emit();
  }
}
