import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { SDKService, SimpleAccount, StaticEnvironmentConfiguration, STFUtils } from '@flaps/core';
import { SelectAccountKbService } from '../select-account-kb.service';
import { IKnowledgeBoxItem, IStandaloneKb } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { Sluggable } from '../../validators';
import { NavigationService } from '../../services';

@Component({
  selector: 'app-select-kb',
  templateUrl: './select-kb.component.html',
  styleUrls: ['./select-kb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectKbComponent implements OnInit, OnDestroy {
  account: SimpleAccount | undefined;
  kbs: IKnowledgeBoxItem[] | undefined;
  standaloneKbs?: IStandaloneKb[];
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

  standalone = this.environmentConfiguration.standalone;

  constructor(
    private navigation: NavigationService,
    private selectService: SelectAccountKbService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    @Inject('staticEnvironmentConfiguration') private environmentConfiguration: StaticEnvironmentConfiguration,
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

    if (this.environmentConfiguration.standalone) {
      this.sdk.nuclia.db
        .getStandaloneKbs()
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe((kbs) => {
          console.log(kbs);
          this.standaloneKbs = kbs;
        });
    }
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
    this.router.navigate(['/select-account-kb']);
  }

  goToAccountManage() {
    this.router.navigate([this.navigation.getAccountManageUrl(this.account!.slug)]);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
