import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, map, of, switchMap, take } from 'rxjs';
import { NuaGuardPolicy, NuaGuardPolicyPayload } from './nua-guard.models';

/**
 * Prototype/concept-stage service — see plan.md, "NUA Guard — feature placement plan". No real
 * backend endpoint exists yet for this feature, so this holds an in-memory list instead of
 * calling `sdk.nuclia.db`, mirroring the shape of `AccountNUAService` so it's a drop-in swap once
 * a real endpoint is designed. `delay(300)` fakes network latency so the list page's loading/empty
 * states can be reviewed like a real integration.
 */
@Injectable({ providedIn: 'root' })
export class NuaGuardService {
  static readonly MAX_ENABLED_POLICIES = 5;

  private policies: NuaGuardPolicy[] = [
    {
      id: 'policy-1',
      name: 'Financial advice',
      description: 'Requests for personalized financial advice are not allowed.',
      instruction: 'Review user requests for prohibited financial advice. Apply the policy strictly.',
      query: 'Does this request ask for personalized investment advice?',
      target: 'QUERY',
      zone: 'europe-1',
      enabled: true,
      blocking: true,
    },
    {
      id: 'policy-2',
      name: 'Competitor mentions',
      description: 'This assistant cannot discuss competitor products.',
      instruction: 'Flag requests that ask the assistant to compare or recommend competitor products.',
      query: 'Does this request ask about a competitor product or service?',
      target: 'QUERY',
      zone: 'europe-1',
      enabled: false,
      blocking: false,
    },
  ];

  private onUpdate = new BehaviorSubject<void>(undefined);

  policies$ = this.onUpdate.pipe(
    switchMap(() => of(this.policies).pipe(delay(300))),
    map((policies) => [...policies]),
  );

  enabledCount$ = this.policies$.pipe(map((policies) => policies.filter((policy) => policy.enabled).length));

  updatePolicies() {
    this.onUpdate.next();
  }

  createPolicy(payload: NuaGuardPolicyPayload) {
    const policy: NuaGuardPolicy = { ...payload, id: `policy-${Date.now()}` };
    return of(policy).pipe(
      delay(300),
      take(1),
      map((created) => {
        this.policies = [...this.policies, created];
        this.updatePolicies();
        return created;
      }),
    );
  }

  editPolicy(id: string, payload: NuaGuardPolicyPayload) {
    return of(payload).pipe(
      delay(300),
      take(1),
      map((update) => {
        this.policies = this.policies.map((policy) => (policy.id === id ? { ...update, id } : policy));
        this.updatePolicies();
        return { ...update, id };
      }),
    );
  }

  deletePolicy(id: string) {
    return of(undefined).pipe(
      delay(300),
      take(1),
      map(() => {
        this.policies = this.policies.filter((policy) => policy.id !== id);
        this.updatePolicies();
      }),
    );
  }
}
