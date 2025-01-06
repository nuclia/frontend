import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { AvatarModel } from '@guillotinaweb/pastanaga-angular';
import { SDKService, UserService } from '@flaps/core';
import { Router } from '@angular/router';

@Component({
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AppLayoutComponent implements OnInit {
  userInfo = this.userService.userInfo;
  avatar: Observable<AvatarModel> = this.userInfo.pipe(
    filter((userInfo) => !!userInfo),
    map((userInfo) => ({
      userName: userInfo?.preferences.name || '–',
      userId: userInfo?.preferences.email,
    })),
  );
  isRoot = false;

  constructor(private router: Router, private userService: UserService, private sdk: SDKService) {}

  ngOnInit() {
    const user = this.sdk.nuclia.auth.getJWTUser();
    this.isRoot = user?.ext.type === 'r';
  }

  logout() {
    this.router.navigate(['/user/logout']);
  }
}
