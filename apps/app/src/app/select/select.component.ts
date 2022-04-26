import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SimpleAccount } from '@flaps/auth';
import { SelectService, AccountsKbs } from './select.service';
import { selectAnimations } from './utils';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  animations: [selectAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectComponent implements OnInit, OnDestroy {
  accounts: SimpleAccount[] | null = null
  kbs: AccountsKbs | null = null;
  selectKb: boolean = false;
  unsubscribeAll = new Subject<void>();

  constructor(
    private selectService: SelectService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.accounts = this.selectService.getAccounts();
    this.kbs = this.selectService.getKbs();
    this.route.url.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.selectKb = this.route.children.length > 0;
      this.cdr.markForCheck();
    });
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
