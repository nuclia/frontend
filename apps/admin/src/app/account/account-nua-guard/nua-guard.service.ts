import { inject, Injectable, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { NuaGuardPolicy, NuaGuardPolicyPayload } from '@nuclia/core';
import { Observable, switchMap, take, tap } from 'rxjs';

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
        this._policies.set(policies);
        this._limitReached.set(policies.filter((policy) => policy.enabled).length >= this.maxEnabledPolicies);
      });
  }

  createPolicy(zone: string, payload: NuaGuardPolicyPayload): Observable<NuaGuardPolicy> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.db.createNuaGuardPolicy(account.id, zone, payload)),
      tap((createdPolicy) => this._policies.update((policies) => policies.concat([createdPolicy]))),
    );
  }
  editPolicy(id: string, zone: string, data: Partial<NuaGuardPolicyPayload>): Observable<NuaGuardPolicy> {
    return this.sdk.currentAccount.pipe(
      take(1),
      switchMap((account) => this.sdk.nuclia.db.editNuaGuardPolicy(id, account.id, zone, data)),
      tap((updatedPolicy) =>
        this._policies.update((policies) => {
          const policyIndex = policies.findIndex((policy) => policy.id === updatedPolicy.id);
          if (policyIndex > -1) {
            policies.splice(policyIndex, 1, updatedPolicy);
          }
          return policies;
        }),
      ),
    );
  }
}
