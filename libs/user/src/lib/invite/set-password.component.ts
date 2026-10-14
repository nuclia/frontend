import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class SetPasswordComponent implements OnInit {
  private readonly sdk = inject(SDKService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    const cameFrom = this.route.snapshot.queryParams['came_from'];
    const params: { [key: string]: string | boolean } = { initial_setpassword: true };
    if (cameFrom) {
      params['came_from'] = cameFrom;
    }
    this.sdk.nuclia.auth.redirectToOAuth(params);
  }
}
