import { inject, Injectable } from '@angular/core';
import { combineLatest, distinctUntilChanged, filter, map, merge, startWith } from 'rxjs';
import { Account } from '@nuclia/core';
import { SDKService, UserService } from '@flaps/core';

type PendoRole = 'owner' | 'contributor' | 'reader';

interface PendoVisitor {
  id: string;
  role: PendoRole;
}

interface PendoAccount {
  id: string;
  title: string;
  plan_type: string;
  workflow?: string;
  creation_date: string;
  blocked_features: string[];
  current_users: number;
  current_kbs: number;
}

declare global {
  interface Window {
    // Defined unconditionally by the loader in index.html; methods just queue silently
    // until the real agent script loads (which only happens on prod, see index.html).
    pendo?: {
      initialize: (options: { visitor: PendoVisitor; account: PendoAccount }) => void;
      identify: (options: { visitor: PendoVisitor; account: PendoAccount }) => void;
      updateOptions: (options: { visitor?: Partial<PendoVisitor> }) => void;
    };
  }
}

/**
 * Feeds visitor/account metadata to Pendo (see apps/dashboard/src/index.html for the loader script).
 * Dashboard-prod-only by construction: on other environments the loader's key is a placeholder,
 * pendo.js 404s, and the calls below just queue harmlessly.
 */
@Injectable({
  providedIn: 'root',
})
export class PendoService {
  private sdk = inject(SDKService);
  private userService = inject(UserService);

  private identifiedAccountId?: string;

  private role = combineLatest([
    this.sdk.currentAccount.pipe(map((account) => account.can_manage_account)),
    merge(
      this.sdk.currentKb.pipe(map((kb) => this.toRole(kb.admin, kb.contrib))),
      this.sdk.currentArag.pipe(map((arag) => this.toRole(arag.admin, arag.contrib))),
    ).pipe(startWith<PendoRole>('reader')),
  ]).pipe(
    // can_manage_account (account-level owner) outranks KB/ARAG-level admin/contrib, and is known
    // as soon as the account loads - no need to wait for a KB/ARAG to be selected.
    map(([canManageAccount, kbOrAragRole]) => (canManageAccount ? 'owner' : kbOrAragRole)),
    distinctUntilChanged(),
  );

  init() {
    combineLatest([this.userService.userInfo.pipe(filter((user) => !!user)), this.sdk.currentAccount])
      .pipe(distinctUntilChanged(([, previous], [, account]) => previous.id === account.id))
      .subscribe(([, account]) => this.identify(account));

    this.role.subscribe((role) => window.pendo?.updateOptions({ visitor: { role } }));
  }

  private toRole(admin?: boolean, contrib?: boolean): PendoRole {
    return admin ? 'owner' : contrib ? 'contributor' : 'reader';
  }

  private identify(account: Account) {
    const visitorId = this.sdk.nuclia.auth.getJWTUser()?.sub;
    if (!visitorId) return;

    const payload = {
      visitor: { id: visitorId, role: (account.can_manage_account ? 'owner' : 'reader') as PendoRole },
      account: {
        id: account.id,
        title: account.title,
        plan_type: account.type,
        workflow: account.workflow,
        creation_date: account.creation_date,
        blocked_features: account.blocked_features,
        current_users: account.current_users || 0,
        current_kbs: account.current_kbs || 0,
      },
    };

    if (!this.identifiedAccountId) window.pendo?.initialize(payload);
    else window.pendo?.identify(payload);

    this.identifiedAccountId = account.id;
  }
}
