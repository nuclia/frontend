import { Injectable } from '@angular/core';
import { Zone } from '../models';
import { catchError, map, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { FeatureFlagService } from '../analytics/feature-flag.service';
import { SDKService } from './sdk.service';
import { BillingService } from './billing.service';
import { AwsAccountSubscription } from '../models/billing.model';
import { setZoneInRegionalUrl } from '@nuclia/core';

const ZONES = 'zones';
const ISRAEL_ONLY_AWS_PRODUCT_CODE = '6wzshxho7p76djrciqtz577dy';

@Injectable({
  providedIn: 'root',
})
export class ZoneService {
  constructor(
    private sdk: SDKService,
    private featureFlagService: FeatureFlagService,
    private billingService: BillingService,
  ) {}

  // Account-scoped: zones are fetched per account so the user only sees zones their account
  // can actually use. Re-fetches automatically when the active account changes.
  private readonly rawZones$: Observable<Zone[]> = this.sdk.currentAccount.pipe(
    switchMap((account) => this.sdk.nuclia.rest.get<Zone[]>(`/account/${account.slug}/${ZONES}`)),
    tap((zones) => {
      // Seed the SDK origin cache so regionalBackend resolves correctly for private zones.
      const origins: { [slug: string]: string | null } = {};
      for (const zone of zones) {
        origins[zone.slug] = zone.origin ?? null;
      }
      this.sdk.nuclia.rest.setZoneOrigins(origins);
    }),
    shareReplay(1),
  );

  getZones(): Observable<Zone[]> {
    return this.rawZones$.pipe(
      switchMap((zones) => {
        return this.featureFlagService.getFeatureBlocklist('zones').pipe(
          map((blocklist) => {
            return this.featureFlagService.showBlockedZones()
              ? zones
              : zones.filter((zone) => !blocklist.includes(zone.slug));
          }),
        );
      }),
      switchMap((zones) =>
        // Keep only AWS zones on AWS_MARKETPLACE subscriptions
        // Filter out aws-il-central-1-1 unless product_code allows it
        this.sdk.hasAccount.pipe(
          take(1),
          switchMap((hasAccount) =>
            hasAccount
              ? this.billingService.getSubscription(true).pipe(
                  take(1),
                  map((subscription) => {
                    // Early return for non-AWS marketplace or stage/dev environments
                    const isAwsMarketplace = subscription?.provider === 'AWS_MARKETPLACE';
                    const shouldFilterZones = isAwsMarketplace && !this.featureFlagService.isStageOrDev;

                    if (!shouldFilterZones) {
                      return zones;
                    }

                    // Filter to AWS zones only
                    const awsZones = zones.filter((zone) => zone.cloud_provider === 'AWS');

                    // Check if Israel zone should be allowed
                    const awsSubscription = subscription.subscription as AwsAccountSubscription;
                    const hasIsraelAccess = awsSubscription.aws_product_code === ISRAEL_ONLY_AWS_PRODUCT_CODE;

                    return hasIsraelAccess ? awsZones : awsZones.filter((zone) => zone.slug !== 'aws-il-central-1-1');
                  }),
                  catchError(() => of(zones)),
                )
              : of(zones),
          ),
        ),
      ),
    );
  }

  /**
   * Returns the base API URL for a zone slug.
   * Uses `origin` directly when set on the zone, otherwise constructs the URL
   * via subdomain substitution: https://{prefix}.{zone}.nuclia.cloud
   */
  buildZoneUrl(zoneSlug: string, backend: string, prefix: string): Observable<string> {
    return this.getZones().pipe(
      take(1),
      map((zones) => {
        const zone = zones.find((z) => z.slug === zoneSlug);
        return zone?.origin ? `${zone.origin}/api` : setZoneInRegionalUrl(backend, zoneSlug, prefix);
      }),
    );
  }
}
