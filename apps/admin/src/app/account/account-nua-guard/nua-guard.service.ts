import { computed, inject, Injectable, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { NuaGuardPolicy, NuaGuardPolicyPayload } from '@nuclia/core';
import { Observable, switchMap, take, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NuaGuardService {
  private readonly sdk = inject(SDKService);

  private readonly maxEnabledPolicies = 5;
  private readonly _policies = signal<NuaGuardPolicy[]>([]);
  readonly limitReached = computed(
    () => this._policies().filter((policy) => policy.enabled).length === this.maxEnabledPolicies,
  );
  readonly policies = this._policies.asReadonly();

  loadPolicies() {
    this.sdk.currentAccount
      .pipe(
        take(1),
        switchMap((account) => this.sdk.nuclia.db.getNuaGuardPolicies(account.id)),
      )
      .subscribe((policies) => this._policies.set(policies));
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
      tap((updatedPolicy) => {
        this._policies.update((policies) =>
          policies.map((policy) => (policy.id === updatedPolicy.id ? updatedPolicy : policy)),
        );
      }),
    );
  }
}
