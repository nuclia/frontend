import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';

// This component is just starting the oauth flow.
// It avoids injecting the sdkservice in the route guard, as the config might not be loaded
// at the time the guard is executed
@Component({
  template: '',
})
export class AppLoginComponent implements OnInit {
  sdk = inject(SDKService);
  route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.sdk.nuclia.auth.redirectToOAuth({ ...params });
    });
  }
}
