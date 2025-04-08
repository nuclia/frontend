import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  ViewChild,
} from '@angular/core';
import { EntryType } from '../../workflow.models';

@Component({
  selector: 'app-connectable-entry',
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
    @if (!noOutput()) {
      <div
        #output
        class="output"
        (click)="clickOutput.emit()">
        <svg
          width="6"
          height="6"
          viewBox="0 0 6 6"
          xmlns="http://www.w3.org/2000/svg">
          <path d="M2 0H4V6H2V0Z" />
          <path d="M0 4V2H6V4H0Z" />
        </svg>
      </div>
    }
  `,
  styleUrl: './connectable-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectableEntryComponent {
  type = input.required<EntryType>();
  noOutput = input(false, { transform: booleanAttribute });
  clickOutput = output();

  @ViewChild('output') outputElement!: ElementRef;
}
