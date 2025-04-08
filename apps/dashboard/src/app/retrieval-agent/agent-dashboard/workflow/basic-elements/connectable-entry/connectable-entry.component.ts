import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { EntryType } from '../../workflow.models';

@Component({
  selector: 'app-connectable-entry',
  imports: [CommonModule],
  templateUrl: './connectable-entry.component.html',
  styleUrl: './connectable-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectableEntryComponent {
  private cdr = inject(ChangeDetectorRef);

  type = input.required<EntryType>();
  noOutput = input(false, { transform: booleanAttribute });
  clickOutput = output();
  activeState = signal(false);

  @ViewChild('output') outputElement!: ElementRef;

  onOutputClick() {
    this.clickOutput.emit();
    this.activeState.set(true);
  }
}
