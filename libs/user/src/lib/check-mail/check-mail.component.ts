import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { UserContainerComponent } from '../user-container/user-container.component';

@Component({
  selector: 'stf-check-mail',
  templateUrl: './check-mail.component.html',
  styleUrls: ['./check-mail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserContainerComponent, RouterLink, TranslatePipe],
})
export class CheckMailComponent {
  email: string;

  constructor(private route: ActivatedRoute) {
    this.email = this.route.snapshot.queryParams['email'];
  }
}
