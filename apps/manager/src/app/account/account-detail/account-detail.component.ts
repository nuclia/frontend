import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { UserSearch } from '../../models/user.model';
import {
  Account,
  AccountBlockingState,
  AccountCreation,
  AccountPatch,
  ActiveCampaignStart,
  BlockedFeature,
} from '../../models/account.model';
import { KnowledgeBoxCreation } from '../../models/stash.model';
import { UsersService } from '../../services/users.service';
import { ZoneService } from '../../services/zone.service';
import { validSlug } from '../../models/form.validator';
import { SDKService } from '@flaps/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ZoneSummary } from '../../models/zone.model';
import { Counters, Nuclia } from '@nuclia/core';
import { catchError, tap } from 'rxjs/operators';

const BLOCKING_STATE_LABEL = {
  [AccountBlockingState.UNBLOCKED]: 'Active',
  [AccountBlockingState.QUOTA]: 'Blocked due to quota',
  [AccountBlockingState.MANAGER]: 'Blocked by manager',
};

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDetailComponent implements OnInit {
  edit: boolean = false;
  account: Account | null = null;
  userSearchList: UserSearch[];
  isRoot: boolean = false;
  isDealer: boolean = false;
  addingMessage: string = '';
  stashmessage: string = '';
  acmessage: string = '';
  url: string | undefined;
  zones: ZoneSummary[] = [];
  kbResourceCount: { [kbId: string]: number } = {};

  accountTitleForm = this.fb.group({
    id: ['', [Validators.required, validSlug()]],
  });

  accountForm = this.fb.group({
    email: ['', [Validators.required]],
    type: ['', [Validators.required]],
    kbs: [''],
    indexer_slow_replicas: [''],
    creator: [{ value: '', disabled: true }],
    url: [{ value: '', disabled: true }],
    zone: ['', [Validators.required]],
  });

  searchUserForm = this.fb.group({
    user: this.fb.control(''),
    email: this.fb.control(''),
  });

  addUserForm = this.fb.group({
    fullname: this.fb.control(''),
    email: this.fb.control(''),
  });

  newStashForm = this.fb.group({
    id: ['', [Validators.required, validSlug()]],
    title: ['', [Validators.required]],
  });

  limitsForm = this.fb.group({
    upload: this.fb.group({
      upload_limit_max_media_file_size: this.fb.control(0),
      upload_limit_max_non_media_file_size: this.fb.control(0),
    }),
    processing: this.fb.group({
      monthly_limit_chars_processed: this.fb.control(0),
      monthly_limit_media_seconds_processed: this.fb.control(0),
      monthly_limit_non_media_files_processed: this.fb.control(0),
    }),
  });
  blockingState?: AccountBlockingState;
  currentState = '';
  blockedFeaturesForm: FormGroup = new FormGroup({
    upload: new FormControl<boolean>(false, { nonNullable: true }),
    processing: new FormControl<boolean>(false, { nonNullable: true }),
    search: new FormControl<boolean>(false, { nonNullable: true }),
    generative: new FormControl<boolean>(false, { nonNullable: true }),
  });

  selectedTab: 'users' | 'kbs' | 'limits' = 'users';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private usersService: UsersService,
    private zoneService: ZoneService,
    private fb: UntypedFormBuilder,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {
    this.userSearchList = [];
  }

  ngOnInit() {
    this.zoneService
      .getZones()
      .pipe(
        tap((zones) => {
          this.zones = zones;
          this.cdr.detectChanges();
        }),
        switchMap(() => this.route.data),
      )
      .subscribe((data: { [account: string]: Account }) => {
        if (data.account) {
          this.account = data.account;
          this.blockingState = this.account.blocking_state;
          this.currentState = BLOCKING_STATE_LABEL[this.account.blocking_state];
          data.account.blocked_features.forEach((blockedFeature) => {
            this.blockedFeaturesForm.controls[blockedFeature]?.patchValue(true);
          });
          const user = this.sdk.nuclia.auth.getJWTUser();
          this.isRoot = user?.ext.type === 'r';
          this.isDealer = user?.ext.type === 'd';
          this.edit = true;

          this.accountTitleForm.controls.id.setValue(data.account.slug);
          this.accountTitleForm.controls.id.disable();

          const formData = {
            email: data.account.email,
            type: data.account.type,
            kbs: data.account.stashes.max_stashes,
            creator: data.account.creator,
            zone: data.account.zone,
            indexer_slow_replicas: data.account.indexer_slow_replicas,
          };
          this.accountForm.patchValue(formData);
          this.limitsForm.patchValue(this.account.limits);
          this.accountForm.controls.zone.disable();
          this.cdr.markForCheck();
        }
      });
  }

  goToStash(stash: string) {
    this.router.navigate(['./' + stash], { relativeTo: this.route });
  }

  refresh() {
    if (this.account?.id) {
      this.accountService.getAccount(this.account.id).subscribe((res: any) => (this.account = res));
    }
  }

  addSeachedUser(user_id: string) {
    if (this.account?.id) {
      this.accountService.addAccountUser(this.account.id, { id: user_id }).subscribe(() => this.refresh());
    }
  }

  delAdminStashifyUser(userId: any) {
    if (this.account) {
      this.accountService.delAdminStashifyUser(this.account.id, userId).subscribe(() => this.refresh());
    }
  }

  setAdminStashifyUser(userId: any) {
    if (this.account) {
      this.accountService.setAdminStashifyUser(this.account.id, userId).subscribe(() => this.refresh());
    }
  }

  deleteUser(userId: string) {
    if (this.account?.id) {
      this.accountService.deleteUser(this.account.id, userId).subscribe(() => {
        this.refresh();
      });
    }
  }

  save() {
    if (this.accountForm.valid && this.edit && this.account?.id) {
      const account: AccountPatch = {
        slug: this.accountTitleForm.controls.id.value,
        email: this.accountForm.controls.email.value,
        type: this.accountForm.controls.type.value,
        kbs: this.accountForm.controls.kbs.value,
        limits: this.limitsForm.value,
      };
      if (this.accountForm.controls.indexer_slow_replicas.value !== this.account.indexer_slow_replicas) {
        account.indexer_slow_replicas = this.accountForm.controls.indexer_slow_replicas.value;
      }

      this.accountService.edit(this.account.id, account).subscribe(() => this.router.navigate(['/accounts']));
    } else if (this.accountForm.valid && this.accountTitleForm.valid && !this.edit) {
      const newAccount: AccountCreation = {
        slug: this.accountTitleForm.controls.id.value,
        title: this.accountTitleForm.controls.id.value,
        email: this.accountForm.controls.email.value,
        zone: this.accountForm.controls.zone.value,
      };
      this.accountService.create(newAccount).subscribe(() => this.router.navigate(['/accounts']));
    }
  }

  search() {
    this.usersService.searchUser(this.searchUserForm.value.user).subscribe((users: UserSearch[]) => {
      const userids = this.account!.users.map((user) => user.id);
      this.userSearchList = users.filter((user) => userids.indexOf(user.id) === -1);
    });
  }

  newStash() {
    if (this.newStashForm.valid && this.account && this.edit) {
      const stash: KnowledgeBoxCreation = {
        id: this.newStashForm.controls.id.value,
        title: this.newStashForm.controls.title.value,
        zone: this.account.zone,
      };
      this.accountService.createStash(this.account.id, stash).subscribe(
        () => this.refresh(),
        (err: any) => {
          this.stashmessage = err.message;
        },
      );
    }
  }

  sendtoac3mt() {
    if (this.account?.id) {
      const campaign: ActiveCampaignStart = {
        // This AC contact list id corresponds to "3 Months Trial" list
        contact_list: 2,
      };
      this.accountService.startACCampaign(this.account.id, campaign).subscribe(
        () => {
          this.acmessage = 'done';
        },
        (err: any) => {
          this.acmessage = err.error.message;
        },
      );
    }
  }

  updateBlockedFeatures() {
    if (this.account?.id) {
      const values: { [key: string]: boolean } = this.blockedFeaturesForm.getRawValue();
      const blockedFeatures = Object.entries(values).reduce((blockedFeatures, [feature, blocked]) => {
        if (blocked) {
          blockedFeatures.push(feature as BlockedFeature);
        }
        return blockedFeatures;
      }, [] as BlockedFeature[]);
      this.accountService
        .updateBlockedFeatures(this.account.id, {
          blocking_state: blockedFeatures.length > 0 ? AccountBlockingState.MANAGER : AccountBlockingState.UNBLOCKED,
          blocked_features: blockedFeatures,
        })
        .subscribe(() => {
          if (blockedFeatures.length > 0 && this.blockingState === AccountBlockingState.UNBLOCKED) {
            this.blockingState = AccountBlockingState.MANAGER;
            this.currentState = BLOCKING_STATE_LABEL[AccountBlockingState.MANAGER];
          } else if (blockedFeatures.length === 0 && this.blockingState !== AccountBlockingState.UNBLOCKED) {
            this.blockingState = AccountBlockingState.UNBLOCKED;
            this.currentState = BLOCKING_STATE_LABEL[AccountBlockingState.UNBLOCKED];
          }
          this.blockedFeaturesForm.markAsPristine();
          this.cdr.markForCheck();
        });
    }
  }

  onTabSelection(tab: 'users' | 'kbs' | 'limits') {
    this.selectedTab = tab;
    if (tab === 'kbs') {
      this._loadKbCount();
    }
  }

  private _loadKbCount() {
    const requests: Observable<{ kbId: string; counters: Counters } | null>[] = [];
    this.account?.stashes.items?.forEach((kb) => {
      const zone = this.zones.find((zone) => zone.id === kb.zone);
      if (zone) {
        const specificNuclia = new Nuclia({ ...this.sdk.nuclia.options, zone: zone.slug, knowledgeBox: kb.id });
        requests.push(
          specificNuclia.knowledgeBox.counters().pipe(
            map((counters) => ({ kbId: kb.id, counters })),
            catchError((error) => {
              console.error(`Loading counters for ${kb.title} failed`, error);
              return of(null);
            }),
          ),
        );
      } else {
        console.error(`No zone found for KB ${kb.title}`, kb, this.zones);
      }
    });

    if (requests.length > 0) {
      forkJoin(requests).subscribe((responses) => {
        responses.forEach((response) => {
          if (response) {
            this.kbResourceCount[response.kbId] = response.counters.resources;
          }
        });
        this.cdr.markForCheck();
      });
    }
  }
}
