import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { take } from 'rxjs';

@Component({
  template: '',
  standalone: false,
})
export class AccountAdministrationRedirectComponent {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sdk: SDKService,
  ) {
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      const tab = this.route.snapshot.data['tab'] as string;
      const action = this.route.snapshot.data['action'] as string | undefined;
      this.router.navigate([`/at/${account.slug}/manage/administration`], {
        queryParams: action ? { tab, action } : { tab },
        replaceUrl: true,
      });
    });
  }
}