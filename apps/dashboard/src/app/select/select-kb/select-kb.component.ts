import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { SDKService, SimpleAccount, STFUtils } from '@flaps/core';
import { NavigationService } from '../../services/navigation.service';
import { SelectService } from '../select.service';
import { Sluggable } from '@flaps/common';
import { IKnowledgeBoxItem } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-select-kb',
  templateUrl: './select-kb.component.html',
  styleUrls: ['./select-kb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectKbComponent implements OnInit, OnDestroy {
  account: SimpleAccount | undefined;
  kbs: IKnowledgeBoxItem[] | undefined;
  addKb: boolean = false;
  accountData = this.route.paramMap.pipe(
    filter((params) => params.get('account') !== null),
    switchMap((params) => this.sdk.nuclia.db.getAccount(params.get('account')!)),
    shareReplay(),
  );
  canManage = this.accountData.pipe(map((account) => account.can_manage_account));
  canAddKb = this.accountData.pipe(
    map((account) => account.can_manage_account && account.max_kbs > account.current_kbs),
  );
  kbName = new FormControl<string>('', [Sluggable()]);
  unsubscribeAll = new Subject<void>();
  errorMessages: IErrorMessages = { sluggable: 'stash.kb_name_invalid' } as IErrorMessages;

  constructor(
    private navigation: NavigationService,
    private selectService: SelectService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        filter((params) => params.get('account') !== null),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((params) => {
        const accountSlug = params.get('account')!;
        const accounts = this.selectService.getAccounts();
        const accountsKbs = this.selectService.getKbs();
        const account = accounts?.find((account) => account.slug === accountSlug);
        const kbs = accountsKbs?.[accountSlug];

        if (account && kbs) {
          this.account = account;
          this.kbs = kbs;
        }
        this.cdr.markForCheck();
      });
  }

  getKbUrl(kbSlug: string) {
    return this.navigation.getKbUrl(this.account!.slug, kbSlug);
  }

  toggleForm() {
    this.addKb = !this.addKb;
    this.kbName.reset();
    this.cdr.markForCheck();
  }

  save() {
    if (this.kbName.invalid || !this.kbName.value) return;

    const kbSlug = STFUtils.generateSlug(this.kbName.value);
    const kbData = {
      slug: kbSlug,
      zone: this.account!.zone,
      title: this.kbName.value,
    };
    this.sdk.nuclia.db.createKnowledgeBox(this.account!.slug, kbData).subscribe(() => {
      this.router.navigate([this.navigation.getKbUrl(this.account!.slug, kbSlug)]);
    });
  }

  back() {
    this.router.navigate(['/select']);
  }

  goToAccountManage() {
    this.router.navigate([this.navigation.getAccountManageUrl(this.account!.slug)]);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
