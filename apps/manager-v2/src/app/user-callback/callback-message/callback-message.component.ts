import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { BackendConfigurationService } from '@flaps/core';

@Component({
  selector: 'app-callback-message',
  templateUrl: './callback-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackMessageComponent {
  private readonly config = inject(BackendConfigurationService);

  readonly message = input.required<string>();

  protected readonly logoPath = `${this.config.getAssetsPath()}/logos/logo-white.svg`;
  protected readonly brandName = this.config.getBrandName();
}
