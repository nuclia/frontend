import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NavigationStart, Router, Scroll } from '@angular/router';
import { filter, Observable, of, Subject } from 'rxjs';
import {
  BackendConfigurationService,
  standaloneSimpleAccount,
  StaticEnvironmentConfiguration,
  SelectAccountKbService,
} from '@flaps/core';
import { selectAnimations } from '../utils';
import { Account } from '@nuclia/core';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-select-account',
  templateUrl: './select-account.component.html',
  styleUrls: ['./select-account.component.scss'],
  animations: [selectAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SelectAccountComponent implements OnInit, OnDestroy {
  accounts: Observable<Account[] | null> = this.selectService.accounts.pipe(
    map((accounts) => (accounts || []).sort((a, b) => a.title.localeCompare(b.title))),
  );
  selectKb: boolean = false;
  unsubscribeAll = new Subject<void>();
  private backendConfig = inject(BackendConfigurationService);
  logoPath = this.backendConfig.getLogoPath();
  brandName = this.backendConfig.getBrandName();

  standalone = this.environment.standalone;

  constructor(
    private selectService: SelectAccountKbService,
    private router: Router,
    private cdr: ChangeDetectorRef,
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
    this.router.navigate(['/user/logout']);
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
