import { ChangeDetectionStrategy, Component } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { AvatarModel } from '@guillotinaweb/pastanaga-angular';
import { UserService } from '@flaps/core';
import { Router } from '@angular/router';

@Component({
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayoutComponent {
  userInfo = this.userService.userInfo;
  avatar: Observable<AvatarModel> = this.userInfo.pipe(
    filter((userInfo) => !!userInfo),
    map((userInfo) => ({
      userName: userInfo?.preferences.name,
      userId: userInfo?.preferences.email,
    })),
  );

  constructor(private router: Router, private userService: UserService) {}

  logout() {
    this.router.navigate(['/user/logout']);
  }
}
