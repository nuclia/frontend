import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connectable-entry',
  imports: [CommonModule],
  template: '<ng-content></ng-content><div class="output" #output></div>',
  styleUrl: './connectable-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectableEntryComponent {
  @ViewChild('output') outputElement!: ElementRef;
}
