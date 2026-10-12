import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'app-resource-handling-banner',
  imports: [RouterLink, TranslatePipe, PaButtonModule, InfoCardComponent],
  templateUrl: './resource-handling-banner.component.html',
  styleUrl: './resource-handling-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceHandlingBannerComponent {
  kbUrl = input.required<string>();
}
