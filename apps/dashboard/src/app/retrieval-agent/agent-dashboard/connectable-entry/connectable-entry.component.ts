import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connectable-entry',
  imports: [CommonModule],
  template: `
    <ng-content></ng-content>
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
  `,
  styleUrl: './connectable-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectableEntryComponent {
  @Output() clickOutput = new EventEmitter();
  @ViewChild('output') outputElement!: ElementRef;
}
