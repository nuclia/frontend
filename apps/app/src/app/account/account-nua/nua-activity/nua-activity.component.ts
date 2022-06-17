import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, filter, map, Observable, Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SDKService, StateService } from '@flaps/auth';
import { AccountNUAService } from '../account-nua.service';
import { Account, NUAClient } from '@nuclia/core';

export interface Activity {
  file: string;
  timestamp: string;
  actor: string;
}

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
      this.nua.clients.pipe(map((clients) => clients.find((client) => client.client_id === params.id))),
    ),
    takeUntil(this._terminator),
  );

  displayedColumns: string[] = ['file', 'timestamp', 'actor'];
  activity: Activity[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private sdk: SDKService,
    private nua: AccountNUAService,
    private stateService: StateService,
  ) {}

  ngOnInit(): void {
    // FIXME: wasn't able to go through the whole process, always got the following response:
    // 403: {"detail":"Nuclia Understanding API key token is either unexistent or revoked"}
    combineLatest([this.stateService.account, this.client])
      .pipe(
        filter(([account, client]) => !!account && !!client),
        map(([account, client]) => ({ account, client } as { account: Account; client: NUAClient })),
        switchMap(({ account, client }) => this.sdk.nuclia.db.getNUAActivity(account.id, client.client_id)),
      )
      .subscribe(console.log);
  }

  ngOnDestroy() {
    this._terminator.next();
    this._terminator.complete();
  }
}
