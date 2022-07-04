import { Component, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, StateService } from '@flaps/core';
import { Account } from '@nuclia/core';
import { stfAnimations } from '@flaps/pastanaga';
import { NavigationService } from '../../services/navigation.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: stfAnimations,
})
export class UserMenuComponent implements OnDestroy {
  @Output() close = new EventEmitter<void>();

  accounts: string[];
  account: Account | null = null;
  private unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private userService: UserService,
    private stateService: StateService,
    private navigation: NavigationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.accounts = this.userService.getUserinfo()?.accounts || [];
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
}
