import { SDKService } from '@flaps/core';
import { Component, inject, OnInit } from '@angular/core';

@Component({
  template: '<div class="user-background"></div>',
  standalone: false,
})
export class LogoutComponent implements OnInit {
  private sdk = inject(SDKService);

  ngOnInit() {
    this.sdk.nuclia.auth.logout();
    this.sdk.nuclia.auth.redirectToOAuth();
  }
}
