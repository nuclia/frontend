import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, filter, map, Observable, Subject, switchMap, take } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StateService } from '@flaps/core';
import { AccountNUAService } from '../account-nua.service';
import { Account, NUAClient } from '@nuclia/core';
import { Activity, NuaActivityService } from './nua-activity.service';

@Component({
  selector: 'app-nua-activity',
  templateUrl: './nua-activity.component.html',
  styleUrls: ['./nua-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuaActivityComponent implements OnInit, OnDestroy {
  private _terminator = new Subject<void>();

  client: Observable<NUAClient | undefined> = this.activatedRoute.params.pipe(
    switchMap((params) =>
      this.nua.clients.pipe(map((clients) => clients.find((client) => client.client_id === params['id']))),
    ),
    takeUntil(this._terminator),
  );

  displayedColumns: string[] = ['file', 'timestamp', 'actor'];

  activityLogs: Observable<Activity[]> = this.nuaActivity.activityLogs;
  hasMore: Observable<boolean> = this.nuaActivity.hasMore;

  constructor(
    private activatedRoute: ActivatedRoute,
    private stateService: StateService,
    private nua: AccountNUAService,
    private nuaActivity: NuaActivityService,
  ) {}

  ngOnInit() {
    combineLatest([this.stateService.account, this.client])
      .pipe(
        filter(([account, client]) => !!account && !!client),
        map(([account, client]) => ({ account, client }) as { account: Account; client: NUAClient }),
        take(1),
        switchMap(({ account, client }) => this.nuaActivity.loadActivity(account.slug, client.client_id)),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this._terminator.next();
    this._terminator.complete();
  }

  loadMoreActivity() {
    this.nuaActivity.loadMore();
  }
}
