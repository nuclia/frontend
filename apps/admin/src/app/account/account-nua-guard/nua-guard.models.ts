/**
 * Prototype-only model for the NUA Guard concept (see plan.md, "NUA Guard — feature placement
 * plan"). There is no backend endpoint for this yet — nothing in `nua.yaml` matches this shape —
 * so this type lives here rather than in `@nuclia/core`, and `NuaGuardService` below is backed by
 * in-memory mock data instead of real API calls. Move this into the SDK once a real endpoint
 * exists.
 *
 * Field shape follows the example payload in GitHub issue nuclia/frontend#3096.
 */
export interface NuaGuardPolicy {
  id: string;
  name: string;
  description?: string;
  instruction: string;
  query: string;
  target: 'QUERY';
  zone: string;
  enabled: boolean;
  blocking: boolean;
}

export type NuaGuardPolicyPayload = Omit<NuaGuardPolicy, 'id'>;
