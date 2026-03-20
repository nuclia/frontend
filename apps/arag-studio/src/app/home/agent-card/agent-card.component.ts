import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { IRetrievalAgentItem } from '@nuclia/core';

@Component({
  selector: 'app-agent-card',
  imports: [CommonModule, RouterLink, TranslateModule, PaButtonModule, PaIconModule, PaTooltipModule],
  templateUrl: './agent-card.component.html',
  styleUrl: './agent-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentCardComponent {
  @Input({ required: true }) agent!: IRetrievalAgentItem;
  @Input({ required: true }) accountSlug!: string;
  @Output() openStudio = new EventEmitter<IRetrievalAgentItem>();
  @Output() openSessions = new EventEmitter<IRetrievalAgentItem>();

  get studioUrl(): string[] {
    return ['/at', this.accountSlug, this.agent.zone, 'arag', this.agent.slug];
  }

  get sessionsUrl(): string[] {
    return ['/at', this.accountSlug, this.agent.zone, 'arag', this.agent.slug, 'sessions'];
  }

  get driversUrl(): string[] {
    return ['/at', this.accountSlug, this.agent.zone, 'arag', this.agent.slug, 'drivers'];
  }
}
