import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { inject } from '@angular/core';

@Component({
  selector: 'app-studio-topbar',
  imports: [CommonModule, RouterLink, TranslateModule, PaButtonModule, PaIconModule],
  templateUrl: './studio-topbar.component.html',
  styleUrl: './studio-topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioTopbarComponent {
  private router = inject(Router);

  @Input({ required: true }) agentTitle!: string;
  @Input({ required: true }) accountSlug!: string;
  @Input({ required: true }) agentSlug!: string;
  @Input({ required: true }) zone!: string;
  @Input() homeUrl: string[] = [];
  @Input() agentState: string = '';

  get studioUrl(): string[] {
    return ['/at', this.accountSlug, this.zone, 'arag', this.agentSlug];
  }

  get isPublished(): boolean {
    return this.agentState === 'PUBLISHED';
  }

  navigateToSearch(): void {
    this.router.navigate(['/at', this.accountSlug, this.zone, 'arag', this.agentSlug, 'search']);
  }
}
