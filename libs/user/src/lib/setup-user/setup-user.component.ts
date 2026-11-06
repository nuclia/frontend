import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MagicService } from '../magic/magic.service';
import { UserContainerComponent } from '../user-container';

@Component({
  templateUrl: './setup-user.component.html',
  styleUrls: ['./setup-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, TranslatePipe, UserContainerComponent],
})
export class SetupUserComponent {
  private readonly magicService = inject(MagicService);
  private readonly navigationService = inject(NavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly sdk = inject(SDKService);

  private params: { [key: string]: string } = {};

  constructor() {
    const app = this.route.snapshot.queryParams['app'];

    if (this.magicService.cameFrom) {
      // The user came from an invitation email
      this.params = { came_from: this.magicService.cameFrom };
    } else if (['platform', 'rag'].includes(app)) {
      this.params = {
        require_eula: 'true',
        redirect_after_eula: app,
      };
    }
  }

  setAccessMethod(setPassword: boolean) {
    const params = this.params;
    if (setPassword) {
      params['initial_setpassword'] = 'true';
    }
    this.navigationService.navigateExternal(`${this.navigationService.getAdminOrigin()}/user/set-password`, {
      queryParams: params,
    });
  }
}
