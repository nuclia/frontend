import { Component, OnInit } from '@angular/core';
import { UserService } from '@flaps/auth';

import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SDKService } from '@flaps/auth';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  fullname: string | undefined;
  type: string | undefined;

  constructor(
    public user: UserService,
    public dialog: MatDialog,
    private router: Router,
    public sheet: MatBottomSheet,
    private sdk: SDKService,
  ) {
    this.user.loggedout.subscribe(() => {
      this.dialog.closeAll();
      this.sheet.dismiss();
    });
  }

  ngOnInit() {
    const user = this.sdk.nuclia.auth.getJWTUser();
    this.fullname = user?.ext.first_name;
    this.type = user?.ext.type;
  }

  logout() {
    this.router.navigate(['/user/logout']);
  }
}
