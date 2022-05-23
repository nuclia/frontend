import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '@flaps/auth';
import { take } from 'rxjs';

@Component({
  selector: 'da-login',
  template: `<div><img src="assets/nuclia-desktop.svg" /></div>`,
  styles: [
    `
      div {
        width: 100%;
        height: 100%;
        display: flex;
      }
      img {
        margin: auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  constructor(private route: ActivatedRoute, private sdk: SDKService, private router: Router) {
    document.write('yep 1<br>');
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      document.write('yep 2<br>');
      const deeplink: string = (window as any).deeplink;
      document.write(`deeplink=${deeplink}<br>`);
      if (deeplink && deeplink.includes('?')) {
        document.write('boom 1<br>');
        const querystring = new URLSearchParams(deeplink.split('?')[1]);
        this.sdk.nuclia.auth.authenticate({
          access_token: querystring.get('access_token') || '',
          refresh_token: querystring.get('refresh_token') || '',
        });
      } else if (params['access_token'] && params['refresh_token']) {
        document.write('boom 2<br>');
        // useful when running the desktop app in dev mode in browser
        this.sdk.nuclia.auth.authenticate({
          access_token: params['access_token'],
          refresh_token: params['refresh_token'],
        });
        this.router.navigate(['/']);
      } else {
        document.write('boom 3<br>');
        (window as any)['electron'].openExternal('http://localhost:4200/redirect?redirect=nuclia-desktop://');
      }
    });
  }
}
