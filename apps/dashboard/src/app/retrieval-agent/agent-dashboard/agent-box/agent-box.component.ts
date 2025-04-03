import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectableEntryComponent } from '../connectable-entry/connectable-entry.component';

@Component({
  selector: 'app-agent-box',
  imports: [CommonModule],
  templateUrl: './agent-box.component.html',
  styleUrl: './agent-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentBoxComponent implements AfterViewInit {
  inputTitle = input('');
  inputEntry = input<ConnectableEntryComponent>();

  @ViewChild('inputElement') inputElement?: ElementRef;

  ngAfterViewInit(): void {
    const entry = this.inputEntry();
    if (entry) {
      console.log(entry.outputElement.nativeElement.getBoundingClientRect());
    }
  }
}
