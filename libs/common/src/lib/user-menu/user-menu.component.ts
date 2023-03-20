import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { StateService } from '@flaps/core';
import { Account, Welcome } from '@nuclia/core';
import { stfAnimations } from '@flaps/pastanaga';
import { Subject, takeUntil } from 'rxjs';
import { AvatarModel } from '@guillotinaweb/pastanaga-angular';
import { NavigationService } from '../services';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: stfAnimations,
})
export class UserMenuComponent implements OnDestroy {
  @Input() set userInfo(userInfo: Welcome | undefined | null) {
    if (userInfo) {
      this.accounts = userInfo.accounts || [];
      if (userInfo.preferences) {
        this.avatar = {
          userName: userInfo.preferences.name,
          userId: userInfo.preferences.email,
        };
      }
    }
  }

  @Output() close = new EventEmitter<void>();

  avatar: AvatarModel = {};
  accounts: string[] = [];
  account: Account | null = null;
  private unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private stateService: StateService,
    private navigation: NavigationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.stateService.account.pipe(takeUntil(this.unsubscribeAll)).subscribe((account) => {
      this.account = account;
      this.cdr?.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goProfile() {
    this.close.emit();
    this.router.navigate(['/user/profile']);
  }

  switchAccount() {
    this.close.emit();
    this.stateService.cleanAccount();
    this.router.navigate([this.navigation.getAccountSelectUrl()]);
  }

  logout() {
    this.close.emit();
    this.router.navigate(['/user/logout']);
  }

  goToSupport() {
    window.open('https://github.com/nuclia/support', '_blank', 'noopener,noreferrer');
  }
}
