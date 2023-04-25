import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AccountDetailsStore } from '../account-details.store';
import { filter, forkJoin, map, Observable, of, switchMap, take } from 'rxjs';
import { KnowledgeBox } from '../../account.models';
import { Counters, Nuclia } from '@nuclia/core';
import { SDKService } from '@flaps/core';
import { catchError } from 'rxjs/operators';

@Component({
  templateUrl: './knowledge-boxes.component.html',
  styleUrls: ['./knowledge-boxes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxesComponent implements OnInit {
  kbList: Observable<KnowledgeBox[]> = this.store.getAccount().pipe(map((account) => account.stashes.items || []));
  counters: { [kbId: string]: number } = {};

  constructor(private store: AccountDetailsStore, private sdk: SDKService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.store.zones
      .pipe(
        filter((zones) => zones.length > 0),
        take(1),
        switchMap((zones) =>
          this.kbList.pipe(
            filter((list) => list.length > 0),
            take(1),
            switchMap((kbs) => {
              const requests: Observable<{ kbId: string; counters: Counters } | null>[] = [];
              kbs.forEach((kb) => {
                const zone = zones.find((z) => z.id === kb.zone);
                if (zone) {
                  const specificNuclia = new Nuclia({
                    ...this.sdk.nuclia.options,
                    zone: zone.slug,
                    knowledgeBox: kb.id,
                  });
                  requests.push(
                    specificNuclia.knowledgeBox.counters().pipe(
                      map((counters) => ({ kbId: kb.id, counters })),
                      catchError((error) => {
                        console.error(`Loading counters for ${kb.slug} failed`, error);
                        return of(null);
                      }),
                    ),
                  );
                } else {
                  console.error(`No zone found for KB ${kb.slug}`, kb, zones);
                }
              });
              return requests.length > 0 ? forkJoin(requests) : of(null);
            }),
          ),
        ),
      )
      .subscribe((responses) => {
        responses?.forEach((response) => {
          if (response) {
            this.counters[response.kbId] = response.counters.resources;
          }
        });
        this.cdr.markForCheck();
      });
  }
}
