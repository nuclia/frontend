import { Component, OnInit } from '@angular/core';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {
  isRoot: boolean | undefined;
  isDealer: boolean | undefined;

  constructor(private sdk: SDKService) {}

  ngOnInit() {
    const user = this.sdk.nuclia.auth.getJWTUser();
    if (user?.ext.type === 'r') {
      this.isRoot = true;
    }
    if (user?.ext.type === 'd') {
      this.isDealer = true;
    }
  }
}
