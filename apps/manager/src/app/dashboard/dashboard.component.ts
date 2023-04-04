import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  fullname: string | undefined;
  type: string | undefined;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private sheet: MatBottomSheet,
    private sdk: SDKService,
  ) {
    this.sdk.nuclia.auth.hasLoggedOut().subscribe(() => {
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
