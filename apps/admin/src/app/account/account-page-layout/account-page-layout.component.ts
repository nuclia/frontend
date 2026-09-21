import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-account-page-layout',
  templateUrl: './account-page-layout.component.html',
  styleUrl: './account-page-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountPageLayoutComponent {
  title = input('');
  description = input('');
  backLink = input<string | null>(null);
  /** ARIA id for the tab-panel div, linked via ariaControls on each pa-tab. */
  panelId = input<string | undefined>(undefined);
}
