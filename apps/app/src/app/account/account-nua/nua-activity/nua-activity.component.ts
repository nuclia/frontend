import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SDKService } from '@flaps/auth';
import { AccountNUAService } from '../account-nua.service';
import { NUAClient } from '@nuclia/core';

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

  constructor(private activatedRoute: ActivatedRoute, private sdk: SDKService, private nua: AccountNUAService) {}

  ngOnInit(): void {
    // TODO load activity logs
  }

  ngOnDestroy() {
    this._terminator.next();
    this._terminator.complete();
  }
}
