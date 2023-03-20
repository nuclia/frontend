import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SimpleAccount, StaticEnvironmentConfiguration } from '@flaps/core';
import { AccountsKbs, SelectAccountKbService } from '../select-account-kb.service';
import { selectAnimations, standaloneSimpleAccount } from '../utils';

@Component({
  selector: 'app-select-account',
  templateUrl: './select-account.component.html',
  styleUrls: ['./select-account.component.scss'],
  animations: [selectAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectAccountComponent implements OnInit, OnDestroy {
  accounts: SimpleAccount[] | null = null;
  kbs: AccountsKbs | null = null;
  selectKb: boolean = false;
  unsubscribeAll = new Subject<void>();

  standalone = this.environment.standalone;

  constructor(
    private selectService: SelectAccountKbService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  ngOnInit() {
    this.accounts = this.selectService.getAccounts();
    this.kbs = this.selectService.getKbs();
    this.route.url.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.selectKb = this.route.children.length > 0;
      this.cdr.markForCheck();
    });

    if (this.standalone) {
      this.accounts = [standaloneSimpleAccount];
      this.kbs = { standalone: [] };
    }
  }

  getAccountUrl(account: string) {
    return `/select/${account}`;
  }

  logout() {
    this.router.navigate(['/user/logout']);
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
