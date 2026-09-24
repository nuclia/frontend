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
import { NavigationStart, Router, RouterLink, RouterOutlet, Scroll } from '@angular/router';
import {
  BrandService,
  SDKService,
  SelectAccountKbService,
  standaloneSimpleAccount,
  StaticEnvironmentConfiguration,
} from '@flaps/core';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Account } from '@nuclia/core';
import { filter, Observable, of, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { selectAnimations } from '../utils';

@Component({
  selector: 'app-select-account',
  templateUrl: './select-account.component.html',
  styleUrls: ['./select-account.component.scss'],
  animations: [selectAnimations],
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

  standalone = this.environment.standalone;

  constructor(
    private selectService: SelectAccountKbService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart || event instanceof Scroll),
        takeUntil(this.unsubscribeAll),
      )
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
      this.accounts = of([standaloneSimpleAccount]);
    }
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
