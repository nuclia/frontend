import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'app-resource-handling-banner',
  imports: [RouterModule, TranslateModule, PaButtonModule, InfoCardComponent],
  templateUrl: './resource-handling-banner.component.html',
  styleUrl: './resource-handling-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceHandlingBannerComponent {
  kbUrl = input.required<string>();
}
