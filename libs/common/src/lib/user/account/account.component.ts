import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { SDKService } from '@flaps/core';
import { Account, IKnowledgeBoxItem } from '@nuclia/core';

@Component({
  selector: 'stf-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  accounts: Account[] = [];
  stashes: { [slug: string]: IKnowledgeBoxItem[] } = {};
  selectedAccount: string | null = null;

  constructor(private router: Router, private sdk: SDKService) {}

  ngOnInit() {
    this.sdk.nuclia.db.getAccounts().subscribe((accounts) => {
      // No accounts
      if (accounts.length === 0) {
        this.router.navigate(['/setup/account']);
        return;
      }

      const stashes$: { [account: string]: Observable<IKnowledgeBoxItem[]> } = {};
      accounts.forEach((account) => {
        stashes$[account.slug] = this.sdk.nuclia.db.getKnowledgeBoxes(account.slug);
      });

      forkJoin(stashes$).subscribe((stashes) => {
        this.accounts = accounts;
        this.stashes = stashes;
        this.checkAccounts();
      });
    });
  }

  checkAccounts() {
    if (this.accounts.length === 1) {
      const accountSlug = this.accounts[0].slug;
      const numStashes = this.stashes[accountSlug].length;

      // One account without kbs
      if (numStashes === 0) {
        this.router.navigate([`/at/${accountSlug}/manage`]);
      }
      // One account with one kb
      else if (numStashes === 1) {
        const stashSlug = this.stashes[accountSlug][0].slug;
        this.router.navigate([`/at/${accountSlug}/${stashSlug}`]);
      }
      // One account with multiple kbs
      else {
        this.selectedAccount = this.accounts[0].slug;
      }
    }
  }

  onOpen(account: string) {
    this.selectedAccount = account;
  }

  onClose(account: string) {
    if (this.selectedAccount === account) {
      this.selectedAccount = null;
    }
  }

  selectAccount(account: string) {
    if (this.stashes[account].length === 0) {
      // TODO: if user has admin role, redirecto to account manage page
      this.goToAccount(account);
    }
  }

  goToStash(account: string, stash: string) {
    this.router.navigate(['/at/' + account + '/' + stash]);
  }

  goToAccount(account: string) {
    this.router.navigate(['/at/' + account]);
  }

  logout() {
    this.router.navigate(['/user/logout']);
  }
}
