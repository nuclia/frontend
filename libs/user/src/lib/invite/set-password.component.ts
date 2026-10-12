import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SDKService } from '@flaps/core';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class SetPasswordComponent implements OnInit {
  private sdk = inject(SDKService);
  ngOnInit() {
    this.sdk.nuclia.auth.redirectToOAuth({ initial_setpassword: true });
  }
}
