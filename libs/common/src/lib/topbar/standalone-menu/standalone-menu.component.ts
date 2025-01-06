import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-standalone-menu',
  imports: [CommonModule, PaButtonModule, PaDropdownModule, PaPopupModule, RouterModule, TranslateModule],
  templateUrl: './standalone-menu.component.html',
  styleUrl: './standalone-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandaloneMenuComponent {
  private sdk = inject(SDKService);

  introspectionUrl = `${this.sdk.nuclia.backend}/v1/introspect`;
}
