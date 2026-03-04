import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserContainerComponent } from '../user-container';
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
