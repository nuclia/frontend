import { SDKService } from '@flaps/auth';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'stf-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {
  constructor(private router: Router, private sdk: SDKService) {}

  ngOnInit() {
    this.sdk.nuclia.auth.logout();
    this.router.navigate(['/user/login']);
  }
}
