import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { NodeCategory } from '../../workflow.models';

@Component({
  selector: 'app-connectable-entry',
  imports: [CommonModule],
  templateUrl: './connectable-entry.component.html',
  styleUrl: './connectable-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectableEntryComponent {
  // identifier of the connectable entry
  id = input.required<string>();
  // category to display when clicking on output
  category = input.required<NodeCategory>();
  // is this entry required for the node to be valid
  required = input(false, { transform: booleanAttribute });
  // does this entry have an output marker
  noOutput = input(false, { transform: booleanAttribute });
  // identifier of this entry’s parent node
  nodeId = input<string | null>();

  clickOutput = output();
  activeState = signal(false);

  @ViewChild('output') outputElement!: ElementRef;

  onOutputClick() {
    this.clickOutput.emit();
    this.activeState.set(true);
  }
}
