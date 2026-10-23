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

  private cameFrom = '';

  constructor() {
    const app = this.route.snapshot.queryParams['app'];
    if (this.magicService.cameFrom) {
      this.cameFrom = this.magicService.cameFrom;
    } else if (['platform', 'rag'].includes(app)) {
      this.cameFrom = this.sdk.getOriginForApp(app);
    }
  }

  setPassword() {
    this.navigationService.navigateExternal(`${this.navigationService.getAdminOrigin()}/user/set-password`, {
      queryParams: { came_from: this.cameFrom },
    });
  }

  useSSO() {
    location.href = this.cameFrom;
  }
}
