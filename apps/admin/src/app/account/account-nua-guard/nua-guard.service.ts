import { inject, Injectable, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { NuaGuardPolicy } from '@nuclia/core';
import { switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NuaGuardService {
  private sdk = inject(SDKService);

  private maxEnabledPolicies = 5;
  private _policies = signal<NuaGuardPolicy[]>([]);
  private _limitReached = signal(false);
  policies = this._policies.asReadonly();

  limitReached = this._limitReached.asReadonly();

  loadPolicies() {
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) => this.sdk.nuclia.db.getNuaGuardPolicies(account.id)),
      )
      .subscribe((policies) => {
        console.log(policies);
        this._policies.set(policies);
        this._limitReached.set(policies.filter((policy) => policy.enabled).length >= this.maxEnabledPolicies);
      });
  }
}
