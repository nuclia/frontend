import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SetAccessMethodComponent implements OnInit {
  private readonly sdk = inject(SDKService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParams;
    const cameFrom = queryParams['came_from'];
    const requireEula = queryParams['require_eula'];
    const initialSetPassword = !!queryParams['initial_setpassword'];
    const redirectAfterEula = queryParams['redirect_after_eula'];

    const params: { [key: string]: string | boolean } = {
      initial_setpassword: initialSetPassword,
    };
    if (requireEula) {
      // Send the user to admin app to accept the EULA before redirecting to the corresponding app
      params['came_from'] = window.location.origin;
      params['redirect_after_eula'] = redirectAfterEula;
    } else if (cameFrom) {
      params['came_from'] = cameFrom;
    }
    this.sdk.nuclia.auth.redirectToOAuth(params);
  }
}
