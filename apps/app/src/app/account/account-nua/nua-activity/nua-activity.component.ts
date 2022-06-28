import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, filter, map, Observable, Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StateService } from '@flaps/auth';
import { AccountNUAService } from '../account-nua.service';
import { Account, NUAClient } from '@nuclia/core';
import { Activity, NuaActivityService } from './nua-activity.service';

@Component({
  selector: 'app-nua-activity',
  templateUrl: './nua-activity.component.html',
  styleUrls: ['./nua-activity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuaActivityComponent implements OnDestroy {
  private _terminator = new Subject<void>();

  client: Observable<NUAClient | undefined> = this.activatedRoute.params.pipe(
    switchMap((params) =>
      this.nua.clients.pipe(map((clients) => clients.find((client) => client.client_id === params.id))),
    ),
    takeUntil(this._terminator),
  );

  displayedColumns: string[] = ['file', 'timestamp', 'actor'];
  activity: Observable<Activity[]> = combineLatest([this.stateService.account, this.client]).pipe(
    filter(([account, client]) => !!account && !!client),
    map(([account, client]) => ({ account, client } as { account: Account; client: NUAClient })),
    switchMap(({ account, client }) => this.nuaActivity.getActivity(account.slug, client.client_id)),
  );

  constructor(
    private activatedRoute: ActivatedRoute,
    private stateService: StateService,
    private nua: AccountNUAService,
    private nuaActivity: NuaActivityService,
  ) {}

  ngOnDestroy() {
    this._terminator.next();
    this._terminator.complete();
  }
}
