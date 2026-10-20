import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterOutlet, Scroll } from '@angular/router';
import { BrandService, SDKService, SelectAccountKbService } from '@flaps/core';
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
  private selectService = inject(SelectAccountKbService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private sdk = inject(SDKService);

  accounts: Observable<Account[] | null> = this.selectService.accounts.pipe(
    map((accounts) => (accounts || []).sort((a, b) => a.title.localeCompare(b.title))),
  );
  selectKb = false;
  unsubscribeAll = new Subject<void>();
  private brandService = inject(BrandService);
  logoPath = this.brandService.logoPath;
  brandName = this.brandService.brandName;

  ngOnInit() {
    // Going back to the account list can slide right away, the list is already rendered
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart || event instanceof Scroll),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((event) => {
        const showKbs =
          event instanceof NavigationStart ? event.url !== '/select' : (event as Scroll).routerEvent.url !== '/select';
        this.showKbs(showKbs);
      });
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
