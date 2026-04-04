import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

interface NavItem {
  icon: string;
  labelKey: string;
  routeSegment: string;
  exact?: boolean;
}

@Component({
  selector: 'app-studio-nav',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, PaIconModule, PaTooltipModule],
  templateUrl: './studio-nav.component.html',
  styleUrl: './studio-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioNavComponent implements OnChanges {
  @Input({ required: true }) accountSlug!: string;
  @Input({ required: true }) agentSlug!: string;
  @Input({ required: true }) zone!: string;
  @Input() homeUrl: string[] = [];

  agentBaseUrl: string[] = [];

  navItems: NavItem[] = [
    { icon: 'workflow', labelKey: 'studio.nav.pipeline', routeSegment: '', exact: true },
    { icon: 'chat', labelKey: 'studio.nav.sessions', routeSegment: 'sessions' },
    { icon: 'plug', labelKey: 'studio.nav.drivers', routeSegment: 'drivers' },
    { icon: 'search', labelKey: 'studio.nav.search', routeSegment: 'search' },
    { icon: 'activity', labelKey: 'studio.nav.activity', routeSegment: 'activity' },
    { icon: 'sliders', labelKey: 'studio.nav.ai-models', routeSegment: 'ai-models' },
    { icon: 'settings', labelKey: 'studio.nav.settings', routeSegment: 'manage' },
  ];

  ngOnChanges(): void {
    if (this.accountSlug && this.zone && this.agentSlug) {
      this.agentBaseUrl = ['/at', this.accountSlug, this.zone, 'arag', this.agentSlug];
    }
  }

  getRouteUrl(segment: string): string[] {
    if (!segment) return this.agentBaseUrl;
    return [...this.agentBaseUrl, segment];
  }
}
