import { ChangeDetectionStrategy, Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'da-login',
  templateUrl: 'login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  login() {
    if ((window as any)['electron']) {
      (window as any)['electron'].openExternal(`${environment.dashboard}/redirect?redirect=nuclia-desktop://`);
    } else if (!location.search) {
      // dev mode in browser
      location.href = `${environment.dashboard}/redirect?redirect=http://localhost:4200`;
    }
  }
}
