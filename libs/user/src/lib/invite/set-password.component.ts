import { Component, inject, OnInit } from '@angular/core';
import { SDKService } from '@flaps/core';

@Component({
  template: '',
})
export class SetPasswordComponent implements OnInit {
  private sdk = inject(SDKService);
  ngOnInit() {
    this.sdk.nuclia.auth.redirectToOAuth({ initial_setpassword: true });
  }
}
