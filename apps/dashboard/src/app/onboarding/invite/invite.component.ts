import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoginService, SDKService } from '@flaps/core';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'nuclia-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InviteComponent {
  constructor(
    private router: Router,
    private sdk: SDKService,
    private loginService: LoginService,
  ) {}

  submit(data: { username?: string; password: string }) {
    this.sdk.nuclia.auth
      .setPassword(data.password)
      .pipe(switchMap(() => this.loginService.setPreferences({ name: data.username || '' })))
      .subscribe({
        next: () => this.router.navigate(['/select']),
        error: () => this.router.navigate(['/select']),
      });
  }
}
