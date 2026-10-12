import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MagicService } from '../magic/magic.service';
import { UserContainerComponent } from '../user-container';

@Component({
  selector: 'nuclia-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, TranslatePipe, UserContainerComponent],
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
