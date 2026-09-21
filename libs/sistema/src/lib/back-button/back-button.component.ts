import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { PaButtonModule, PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { RouterModule } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'nsi-back-button',
  imports: [NgTemplateOutlet, RouterModule, PaTranslateModule, PaButtonModule, PaIconModule],
  templateUrl: './back-button.component.html',
  styleUrl: './back-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  link = input<string | null>();

  // Intentionally duplicated from `isAbsoluteUrl` (`libs/core/utils`): `libs/core` already
  // imports from `@nuclia/sistema`, so importing it back here would create a circular lib
  // dependency.
  isExternalLink = computed(() => !!this.link() && /^https?:\/\//.test(this.link()!));
}
