import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectableEntryComponent } from '../connectable-entry/connectable-entry.component';
import { LinkService } from '../link/link.service';

@Component({
  selector: 'app-agent-box',
  imports: [CommonModule],
  templateUrl: './agent-box.component.html',
  styleUrl: './agent-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentBoxComponent implements AfterViewInit {
  private linkService = inject(LinkService);

  inputTitle = input('');
  inputEntry = input<ConnectableEntryComponent>();

  @ViewChild('inputElement') inputElement?: ElementRef;

  ngAfterViewInit(): void {
    const entry = this.inputEntry();
    if (entry && this.inputElement) {
      const leftBox = entry.outputElement.nativeElement.getBoundingClientRect();
      const rightBox = this.inputElement.nativeElement.getBoundingClientRect();
      this.linkService.drawLink(leftBox, rightBox);
    }
  }
}
