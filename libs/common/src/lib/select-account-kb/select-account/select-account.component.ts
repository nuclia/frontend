import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { BrandService, SDKService, SelectAccountKbService, StaticEnvironmentConfiguration } from '@flaps/core';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Account } from '@nuclia/core';
import { filter, Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-select-account',
  templateUrl: './select-account.component.html',
  styleUrls: ['./select-account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PaIconModule, PaButtonModule, RouterOutlet, AsyncPipe, TranslatePipe],
})
export class SelectAccountComponent implements OnInit, OnDestroy {
  accounts: Observable<Account[] | null> = this.selectService.accounts.pipe(
    map((accounts) => (accounts || []).sort((a, b) => a.title.localeCompare(b.title))),
  );
  selectKb = false;
  unsubscribeAll = new Subject<void>();
  private brandService = inject(BrandService);
  logoPath = this.brandService.logoPath;
  brandName = this.brandService.brandName;

  constructor(
    private selectService: SelectAccountKbService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  ngOnInit() {
    // Going back to the account list can slide right away, the list is already rendered
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart && event.url === '/select'),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.showKbs(false));
  }

  // Going forward waits for the outlet content: it only exists once the route guards have loaded the KB list,
  // so sliding earlier would show an empty panel that then pops in.
  showKbs(visible: boolean) {
    this.selectKb = visible;
    this.cdr.markForCheck();
  }

  logout() {
    this.sdk.nuclia.auth.logout();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }

  selectAccount(account: Account) {
    this.selectService.selectAccount(account.slug).subscribe();
  }
}
