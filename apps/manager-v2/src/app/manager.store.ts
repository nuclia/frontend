import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '@flaps/core';
import { AccountBlockingState, BlockedFeature, UserType } from '@nuclia/core';
import { AccountDetails, AccountUser, KbDetails, KbSummary, ProjectDetails } from './manage-accounts/account-ui.models';
import { ZoneModels } from './manage-accounts/regional-account.models';

const BLOCKING_STATE_LABEL = {
  [AccountBlockingState.UNBLOCKED]: 'Active',
  [AccountBlockingState.QUOTA]: 'Blocked due to quota',
  [AccountBlockingState.MANAGER]: 'Blocked by manager',
};

@Injectable({ providedIn: 'root' })
export class ManagerStore {
  private userService = inject(UserService);
  private userType = toSignal(this.userService.userType);

  private allowedFor = (...types: UserType[]) =>
    computed(() => {
      const type = this.userType();
      return !!type && types.includes(type);
    });

  readonly canUseManager = computed(() => {
    const type = this.userType();
    return !!type && type !== 'USER';
  });
  readonly canEdit = computed(() => {
    const type = this.userType();
    return !!type && type !== 'USER' && type !== 'READONLY';
  });
  readonly canDelete = this.allowedFor('ROOT');
  readonly canDeleteAccount = this.allowedFor('ROOT', 'ADMIN');
  readonly canManageZones = this.allowedFor('ROOT');
  readonly canSendEmails = this.allowedFor('ROOT');
  readonly canSeeGlobalUsers = this.allowedFor('ROOT', 'READONLY', 'MANAGER');
  readonly canSeeUsers = this.allowedFor('ROOT', 'READONLY', 'MANAGER', 'ADMIN');
  readonly canManageModels = this.allowedFor('ROOT', 'MANAGER', 'ADMIN');
  readonly canCreateAccount = this.allowedFor('ROOT', 'MANAGER');
  readonly canCreateUser = this.allowedFor('ROOT', 'MANAGER');
  readonly canFullyEditAccount = this.allowedFor('ROOT', 'MANAGER', 'ADMIN');
  readonly canAccessKBs = this.allowedFor('ROOT', 'MANAGER', 'READONLY', 'ADMIN');
  readonly canAccessProjects = this.allowedFor('ROOT', 'MANAGER', 'READONLY', 'ADMIN');

  private _accountDetails = signal<AccountDetails | null>(null);
  private _kbList = signal<KbSummary[]>([]);
  private _kbDetails = signal<KbDetails | null>(null);
  private _blockedFeatures = signal<BlockedFeature[]>([]);
  private _currentState = signal('');
  private _accountUsers = signal<AccountUser[]>([]);
  private _accountModels = signal<ZoneModels[]>([]);
  private _projectList = signal<ProjectDetails[]>([]);
  private _projectDetails = signal<ProjectDetails | null>(null);

  readonly accountDetails = this._accountDetails.asReadonly();
  readonly kbList = this._kbList.asReadonly();
  readonly kbDetails = this._kbDetails.asReadonly();
  readonly blockedFeatures = this._blockedFeatures.asReadonly();
  readonly currentState = this._currentState.asReadonly();
  readonly accountUsers = this._accountUsers.asReadonly();
  readonly accountModels = this._accountModels.asReadonly();
  readonly projectList = this._projectList.asReadonly();
  readonly projectDetails = this._projectDetails.asReadonly();

  setAccountDetails(details: AccountDetails | null) {
    this._accountDetails.set(details);
    if (details?.blockingState) {
      this._currentState.set(BLOCKING_STATE_LABEL[details.blockingState]);
    }
  }
  setKbList(list: KbSummary[]) {
    this._kbList.set(list);
  }
  setKbDetails(details: KbDetails | null) {
    this._kbDetails.set(details);
  }
  setBlockedFeatures(features: BlockedFeature[]) {
    this._blockedFeatures.set(features);
  }
  setAccountUsers(users: AccountUser[]) {
    this._accountUsers.set(
      users.toSorted((a, b) => {
        if (a.isManager && !b.isManager) {
          return -1;
        } else if (!a.isManager && b.isManager) {
          return 1;
        } else {
          return (a.name || '').localeCompare(b.name || '');
        }
      }),
    );
  }
  setAccountModels(models: ZoneModels[]) {
    this._accountModels.set(models);
  }
  setProjectList(projects: ProjectDetails[]) {
    this._projectList.set(projects);
  }
  setProjectDetails(project: ProjectDetails) {
    this._projectDetails.set(project);
  }

  getAccountId(): string | undefined {
    return this._accountDetails()?.id;
  }
}
