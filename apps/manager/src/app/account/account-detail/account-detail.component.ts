import { ActivatedRoute, Router } from '@angular/router';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AccountService } from './../../services/account.service';
import { UserSearch } from '../../models/user.model';
import {
  Account,
  AccountPatch,
  AccountCreation,
  ActiveCampaignStart,
  AccountBlockingState,
} from '../../models/account.model';
import { KnowledgeBoxCreation } from '../../models/stash.model';
import { UsersService } from '../../services/users.service';
import { ZoneService } from '../../services/zone.service';
import { validSlug } from '../../models/form.validator';
import { SDKService } from '@flaps/auth';
import { forkJoin, map, Observable, of } from 'rxjs';
import { MatTabChangeEvent } from '@angular/material/tabs/tab-group';
import { ZoneSummary } from '../../models/zone.model';
import { Counters, Nuclia } from '@nuclia/core';
import { catchError } from 'rxjs/operators';

const STATUSES = { 0: 'Active', 1: 'Blocked due to quota', 2: 'Blocked by manager' };
@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss'],
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
  state = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private usersService: UsersService,
    private zoneService: ZoneService,
    private fb: FormBuilder,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {
    this.userSearchList = [];
    this.route.data.subscribe((data: { [account: string]: Account }) => {
      if (data.account) {
        this.account = data.account;
        this.state = STATUSES[this.account.blocking_state];
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
        this.accountForm.controls.zone.disable();
        this.limitsForm.patchValue(this.account.limits);
      }
    });
  }

  ngOnInit() {
    this.zoneService.getZones().subscribe((zones) => {
      this.zones = zones;
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

  block() {
    this.changeState(AccountBlockingState.MANAGER);
  }

  unblock() {
    this.changeState(AccountBlockingState.NONE);
  }

  private changeState(state: AccountBlockingState) {
    const obs = this.account?.id
      ? this.accountService
          .edit(this.account.id, { blocking_state: AccountBlockingState.MANAGER })
          .pipe(map(() => true))
      : of(false);
    obs.subscribe((res) => {
      if (res && this.account) {
        this.account.blocking_state = state;
        this.state = STATUSES[this.account.blocking_state];
      }
    });
  }

  onTabSelection($event: MatTabChangeEvent) {
    if ($event.index === 1) {
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
