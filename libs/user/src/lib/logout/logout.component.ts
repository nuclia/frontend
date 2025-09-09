import { SDKService } from '@flaps/core';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  template: '<div class="user-background"></div>',
  standalone: false,
})
export class LogoutComponent implements OnInit {
  constructor(private router: Router, private sdk: SDKService) {}

  ngOnInit() {
    this.sdk.nuclia.auth.logout();
    this.router.navigate(['/user/login']);
  }
}
