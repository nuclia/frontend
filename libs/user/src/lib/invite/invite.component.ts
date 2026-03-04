import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BackendConfigurationService, LoginService, SDKService } from '@flaps/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { PasswordFormComponent } from './password-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { UserContainerComponent } from '../user-container';
import { SsoButtonsComponent } from '../sso/sso-buttons.component';
import { MagicService } from '../magic/magic.service';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nuclia-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, TranslateModule, UserContainerComponent],
})
export class InviteComponent {
  private magicService = inject(MagicService);

  setPassword() {
    location.href = `${this.magicService.cameFrom}/user/set-password`;
  }

  useSSO() {
    location.href = this.magicService.cameFrom;
  }
}
