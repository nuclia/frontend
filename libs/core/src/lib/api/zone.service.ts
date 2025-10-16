import { Injectable } from '@angular/core';
import { Zone } from '../models';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { FeatureFlagService } from '../analytics/feature-flag.service';
import { SDKService } from './sdk.service';
import { take } from 'rxjs/operators';
import { BillingService } from './billing.service';
import { AwsAccountSubscription } from '../models/billing.model';

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

  getZones(): Observable<Zone[]> {
    return this.sdk.nuclia.rest.get<Zone[]>(`/${ZONES}`).pipe(
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
                    
                    return hasIsraelAccess 
                      ? awsZones 
                      : awsZones.filter((zone) => zone.slug !== 'aws-il-central-1-1');
                  }),
                  catchError(() => of(zones)),
                )
              : of(zones),
          ),
        ),
      ),
    );
  }
}
