import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { LOCAL_SYNC_SERVER, SYNC_SERVER_KEY } from '../sync/sync.service';
import { SyncService } from '../sync/sync.service';
import { NavigationService } from '@flaps/core';
import { take } from 'rxjs';

@Component({
  selector: 'nsy-server-setup',
  templateUrl: './server-setup.component.html',
  styleUrls: ['./server-setup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerSetupComponent {
  localUrl = LOCAL_SYNC_SERVER;
  serverUrl = new FormControl<string>(localStorage.getItem(SYNC_SERVER_KEY) || '', { nonNullable: true });

  constructor(
    private sync: SyncService,
    private navigationService: NavigationService,
    private router: Router,
  ) {}

  save() {
    this.sync.setSyncServer(this.serverUrl.value);
    this.back();
  }

  back() {
    this.navigationService.kbUrl.pipe(take(1)).subscribe((url) => this.router.navigate([`${url}/upload`]));
  }

  setDefaultLocal() {
    this.serverUrl.setValue(this.localUrl);
  }
}
