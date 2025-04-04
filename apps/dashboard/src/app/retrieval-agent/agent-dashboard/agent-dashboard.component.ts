import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { AgentBoxComponent } from './agent-box/agent-box.component';
import { ConnectableEntryComponent } from './connectable-entry/connectable-entry.component';
import { ArrowDownComponent } from './arrow-down.component';
import { LinkService } from './link/link.service';

@Component({
  imports: [CommonModule, ArrowDownComponent, PaButtonModule, AgentBoxComponent, ConnectableEntryComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentDashboardComponent implements AfterViewInit {
  private linkService = inject(LinkService);

  @ViewChild('linkContainer') linkContainer?: ElementRef;

  ngAfterViewInit(): void {
    if (this.linkContainer) {
      this.linkService.container = this.linkContainer;
    }
  }
}
