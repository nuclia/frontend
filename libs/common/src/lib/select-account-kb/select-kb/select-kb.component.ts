import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { SDKService, standaloneSimpleAccount, StaticEnvironmentConfiguration, STFUtils } from '@flaps/core';
import { SelectAccountKbService } from '../select-account-kb.service';
import { IKnowledgeBoxItem, KBRoles } from '@nuclia/core';
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
export class SelectKbComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();
  standalone = this.environment.standalone;

  private kbs$ = new BehaviorSubject<IKnowledgeBoxItem[] | null>(null);
  kbs: Observable<IKnowledgeBoxItem[] | null> = this.kbs$.asObservable();

  account = this.route.paramMap.pipe(
    filter((params) => params.get('account') !== null),
    switchMap((params) =>
      this.standalone ? of(standaloneSimpleAccount) : this.sdk.nuclia.db.getAccount(params.get('account')!),
    ),
    shareReplay(),
  );
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
  kbName = new FormControl<string>('', [Sluggable()]);
  errorMessages: IErrorMessages = { sluggable: 'stash.kb_name_invalid' } as IErrorMessages;

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
  ) {
    const loadKbs: Observable<IKnowledgeBoxItem[] | null> = this.standalone
      ? this.sdk.nuclia.db.getStandaloneKbs().pipe(
          map((kbs) =>
            kbs.map((kb) => ({
              id: kb.uuid,
              slug: kb.uuid,
              zone: 'local',
              title: kb.slug,
              role_on_kb: 'SOWNER' as KBRoles,
            })),
          ),
          catchError((error) => {
            this.toast.error(
              'We cannot load your knowledge box, please check NucliaDB docker image is running and try again.',
            );
            return throwError(error);
          }),
        )
      : this.selectService.kbs;
    loadKbs.subscribe((kbs) => this.kbs$.next(kbs));
  }

  toggleForm() {
    this.addKb = !this.addKb;
    this.kbName.reset();
    this.cdr.markForCheck();
  }

  save() {
    if (this.kbName.invalid || !this.kbName.value) {
      return;
    }

    this.creatingKb = true;
    this.kbName.disable();
    const kbSlug = STFUtils.generateSlug(this.kbName.value);
    const kbTitle = this.kbName.value;

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
              this.router.navigate([this.navigation.getKbUrl(account.slug, this.standalone ? kb.id : kbSlug)]);
            }),
          );
        }),
      )
      .subscribe({
        error: () => {
          this.toast.error('error.creating-kb');
          this.creatingKb = false;
          this.kbName.enable();
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
      this.account.subscribe((account) => {
        this.router.navigate([this.navigation.getKbUrl(account.slug, kbSlug)]);
      });
    }
  }

  deleteKb(event: MouseEvent, slug: string, title?: string) {
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: 'stash.delete.delete',
        description: `${title || ''} (${slug})`,
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((yes) => !!yes),
        switchMap(() => this.account),
        switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.slug, slug)),
        switchMap((kb) => kb.delete()),
      )
      .subscribe(() => this.kbs$.next((this.kbs$.value || []).filter((kb) => kb.slug !== slug)));
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
