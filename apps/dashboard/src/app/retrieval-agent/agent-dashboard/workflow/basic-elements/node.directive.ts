import { Directive, HostListener, input, output, ViewChild } from '@angular/core';
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
  removeNode = output();
  selectNode = output();

  @ViewChild(AgentBoxComponent) boxComponent?: AgentBoxComponent;

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
    this.addNode.emit({ entry, targetColumn: this.nextColumnIndex });
  }
  onTrashClick() {
    this.removeNode.emit();
  }
}
