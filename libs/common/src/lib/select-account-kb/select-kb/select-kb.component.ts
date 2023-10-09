import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { catchError, Subject, throwError } from 'rxjs';
import { filter, map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { SDKService, StaticEnvironmentConfiguration, STFUtils, standaloneSimpleAccount } from '@flaps/core';
import { SelectAccountKbService } from '../select-account-kb.service';
import { Account, IKnowledgeBoxItem } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { Sluggable } from '../../validators';
import { NavigationService } from '../../services';
import { SisModalService, SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-select-kb',
  templateUrl: './select-kb.component.html',
  styleUrls: ['./select-kb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectKbComponent implements OnInit, OnDestroy {
  account: Account | undefined;
  kbs: IKnowledgeBoxItem[] | undefined;
  addKb: boolean = false;
  accountData = this.route.paramMap.pipe(
    filter((params) => !this.standalone && params.get('account') !== null),
    switchMap((params) => this.sdk.nuclia.db.getAccount(params.get('account')!)),
    shareReplay(),
  );
  canManage = this.accountData.pipe(map((account) => account.can_manage_account));
  canAddKb = this.accountData.pipe(
    map(
      (account) =>
        account.can_manage_account && (account.max_kbs > (account.current_kbs || 0) || account.max_kbs === -1),
    ),
  );
  kbName = new FormControl<string>('', [Sluggable()]);
  unsubscribeAll = new Subject<void>();
  errorMessages: IErrorMessages = { sluggable: 'stash.kb_name_invalid' } as IErrorMessages;

  standalone = this.environment.standalone;
  creatingKb = false;

  constructor(
    private navigation: NavigationService,
    private selectService: SelectAccountKbService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private toast: SisToastService,
    private modalService: SisModalService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
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

    if (this.standalone) {
      this.sdk.nuclia.db
        .getStandaloneKbs()
        .pipe(
          catchError((error) => {
            this.toast.error(
              'We cannot load your knowledge box, please check NucliaDB docker image is running and try again.',
            );
            return throwError(error);
          }),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe((kbs) => {
          this.account = standaloneSimpleAccount;
          this.kbs = kbs.map((kb) => ({
            id: kb.uuid,
            slug: kb.uuid,
            zone: 'local',
            title: kb.slug,
            role_on_kb: 'SOWNER',
          }));
          this.cdr.markForCheck();
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

    this.creatingKb = true;
    this.kbName.disable();
    const kbSlug = STFUtils.generateSlug(this.kbName.value);
    const kbData = {
      slug: kbSlug,
      zone: this.account!.zone,
      title: this.kbName.value,
    };
    this.sdk.nuclia.db.createKnowledgeBox(this.account!.slug, kbData).subscribe({
      next: (kb) => {
        this.router.navigate([this.navigation.getKbUrl(this.account!.slug, this.standalone ? kb.id : kbSlug)]);
      },
      error: () => {
        this.toast.error('error.creating-kb');
        this.creatingKb = false;
        this.kbName.enable();
      },
    });
  }

  goToAccountManage() {
    this.router.navigate([this.navigation.getAccountManageUrl(this.account!.slug)]);
  }

  deleteKb(event: MouseEvent, slug: string, title: string) {
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: 'stash.delete.delete',
        description: `${title} (${slug})`,
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((yes) => !!yes),
        switchMap(() => this.sdk.nuclia.db.getKnowledgeBox(this.account!.slug, slug)),
        switchMap((kb) => kb.delete()),
      )
      .subscribe(() => {
        this.kbs = (this.kbs || []).filter((kb) => kb.slug !== slug);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
