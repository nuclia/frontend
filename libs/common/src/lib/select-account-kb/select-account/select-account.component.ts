import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router, Scroll } from '@angular/router';
import { filter, Subject } from 'rxjs';
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

    if (this.accounts?.length === 1) {
      this.router.navigate([this.getAccountUrl(this.accounts[0].slug)]);
    }
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart || event instanceof Scroll))
      .subscribe((event) => {
        // Good animation is done using NavigationStart,
        // but we also listen to Scroll event because NavigationStart isn't triggered when loading a page directly
        if (event instanceof NavigationStart) {
          this.selectKb = event.url !== '/select';
        } else {
          this.selectKb = (event as Scroll).routerEvent.url !== '/select';
        }
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
