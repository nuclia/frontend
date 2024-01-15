import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, forkJoin, Observable, of, shareReplay, Subject, switchMap, take, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { SDKService, STFUtils, ZoneService } from '@flaps/core';
import { SelectAccountKbService } from '../select-account-kb.service';
import { IKnowledgeBoxItem } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { NavigationService } from '../../services';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { KbAddComponent } from '../../kb-add';

@Component({
  selector: 'app-select-kb',
  templateUrl: './select-kb.component.html',
  styleUrls: ['./select-kb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectKbComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();
  standalone = this.selectService.standalone;

  kbs: Observable<IKnowledgeBoxItem[] | null> = this.sdk.kbList.pipe(shareReplay());
  hasSeveralAccounts: Observable<boolean> = this.selectService.accounts.pipe(
    map((accounts) => !!accounts && accounts.length > 1),
  );

  account = this.sdk.currentAccount;
  canManage = this.account.pipe(map((account) => account.can_manage_account));
  canAddKb = this.standalone
    ? of(true)
    : this.account.pipe(
        map(
          (account) =>
            account.can_manage_account && (account.max_kbs > (account.current_kbs || 0) || account.max_kbs === -1),
        ),
      );
  addKb: boolean = false;
  newKbForm = new FormGroup({
    kbName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  errorMessages: IErrorMessages = { required: 'validation.required' } as IErrorMessages;
  creatingKb = false;

  constructor(
    private navigation: NavigationService,
    private selectService: SelectAccountKbService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private toast: SisToastService,
    private modalService: SisModalService,
    private zoneService: ZoneService,
  ) {}

  openKbForm() {
    if (this.standalone) {
      this.toggleForm();
    } else {
      forkJoin([this.account.pipe(take(1)), this.zoneService.getZones()])
        .pipe(
          switchMap(([account, zones]) => {
            if (!this.sdk.nuclia.options.zone) {
              // zone must be set to get configuration schema
              this.sdk.nuclia.options.zone = zones[0]?.slug;
            }
            return this.modalService.openModal(KbAddComponent, { dismissable: true, data: { account, zones } }).onClose;
          }),
          filter((result) => {
            if (result?.success === false) {
              this.toast.error('error.creating-kb');
            }
            return !!result?.success;
          }),
        )
        .subscribe(() => {
          this.sdk.refreshKbList();
        });
    }
  }

  toggleForm() {
    this.addKb = !this.addKb;
    this.newKbForm.reset();
    this.cdr.markForCheck();
  }

  save() {
    if (this.newKbForm.invalid || !this.newKbForm.value) {
      return;
    }

    this.creatingKb = true;
    this.newKbForm.disable();
    const formValue = this.newKbForm.getRawValue();
    const kbSlug = STFUtils.generateSlug(formValue.kbName);
    const kbTitle = formValue.kbName;

    this.account
      .pipe(
        switchMap((account) => {
          const kbData = {
            slug: kbSlug,
            zone: account.zone,
            title: kbTitle,
          };
          return this.sdk.nuclia.db.createKnowledgeBox(account.slug, kbData).pipe(
            tap((kb) => {
              this.sdk.refreshKbList();
              this.router.navigate([this.navigation.getKbUrl(account.slug, kb.id)]);
            }),
          );
        }),
      )
      .subscribe({
        error: () => {
          this.toast.error('error.creating-kb');
          this.creatingKb = false;
          this.newKbForm.enable();
        },
      });
  }

  goToAccountManage() {
    this.account
      .pipe(take(1))
      .subscribe((account) => this.router.navigate([this.navigation.getAccountManageUrl(account.slug)]));
  }

  goToKb(kb: IKnowledgeBoxItem) {
    if (kb.slug && kb.role_on_kb) {
      const kbSlug = kb.slug;
      this.sdk.nuclia.options.knowledgeBox = kb.id;

      if (!this.standalone) {
        this.sdk.nuclia.options.zone = kb.zone;
        forkJoin([this.sdk.nuclia.rest.getZones(), this.account.pipe(take(1))]).subscribe(([zones, account]) =>
          this.router.navigate([this.navigation.getKbUrl(account.slug, kbSlug)]),
        );
      } else {
        this.account
          .pipe(take(1))
          .subscribe((account) => this.router.navigate([this.navigation.getKbUrl(account.slug, kbSlug)]));
      }
    }
  }

  deleteKb(event: MouseEvent, kbId: string, zone: string, title?: string) {
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: 'stash.delete.delete',
        description: `${title || ''} (${kbId})`,
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((yes) => !!yes),
        switchMap(() => this.account),
        switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, kbId, zone)),
        switchMap((kb) => kb.delete()),
      )
      .subscribe(() => this.sdk.refreshKbList());
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
